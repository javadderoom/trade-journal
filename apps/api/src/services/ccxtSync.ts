import ccxt from 'ccxt';
import { prisma } from './tradeSync';
import { decrypt } from '../lib/encryption';

function stringToHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % 2147483647; // Positive signed 32-bit int
}

export interface SyncResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function testConnection(params: {
  exchangeId: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
}): Promise<boolean> {
  const { exchangeId, apiKey, apiSecret, passphrase } = params;
  const exchangeClass = (ccxt as any)[exchangeId];
  if (!exchangeClass) {
    throw new Error(`Exchange ${exchangeId} is not supported`);
  }

  const exchange = new exchangeClass({
    apiKey,
    secret: apiSecret,
    password: passphrase || undefined,
    enableRateLimit: true,
  });

  try {
    await exchange.fetchBalance();
    return true;
  } catch (err: any) {
    console.error(`Connection test failed for ${exchangeId}:`, err);
    throw new Error(err.message || 'Failed to authenticate with exchange API');
  }
}

export async function syncExchangeTrades(
  userId: string,
  accountId: string
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, skipped: 0, errors: [] };

  // 1. Fetch exchange credentials
  const connection = await prisma.exchangeConnection.findFirst({
    where: { account_id: accountId, account: { user_id: userId } },
    include: { account: true },
  });

  if (!connection) {
    throw new Error('Exchange credentials not found for this account.');
  }

  if (!connection.is_active) {
    throw new Error('Exchange connection is currently inactive.');
  }

  const exchangeId = connection.exchange_id;
  const apiKey = decrypt(connection.api_key);
  const apiSecret = decrypt(connection.api_secret);
  const passphrase = connection.passphrase ? decrypt(connection.passphrase) : undefined;

  // 2. Initialize exchange
  const exchangeClass = (ccxt as any)[exchangeId];
  if (!exchangeClass) {
    throw new Error(`Exchange ${exchangeId} is not supported`);
  }

  const exchange = new exchangeClass({
    apiKey,
    secret: apiSecret,
    password: passphrase || undefined,
    enableRateLimit: true,
  });

  await exchange.loadMarkets();

  let since: number | undefined = undefined;
  if (connection.account.last_sync_at) {
    since = connection.account.last_sync_at.getTime();
  }

  let ccxtTrades: any[] = [];

  // 3. Fetch trades from exchange
  if (exchange.has['fetchMyTrades']) {
    try {
      ccxtTrades = await exchange.fetchMyTrades(undefined, since);
    } catch (err: any) {
      if (err.name === 'ArgumentsRequired' || err.message.includes('symbol')) {
        try {
          const balance = await exchange.fetchBalance();
          const activeBalances = Object.keys(balance.total).filter(
            coin => balance.total[coin] > 0
          );

          const symbolsToFetch = exchange.symbols.filter((sym: string) => {
            const [base, quote] = sym.split('/');
            return activeBalances.includes(base) || activeBalances.includes(quote);
          });

          for (const sym of symbolsToFetch.slice(0, 15)) {
            try {
              const symTrades = await exchange.fetchMyTrades(sym, since);
              ccxtTrades = ccxtTrades.concat(symTrades);
            } catch (symErr: any) {
              console.error(`Failed to fetch trades for symbol ${sym}:`, symErr);
            }
          }
        } catch (balErr: any) {
          throw new Error(`Failed to fetch account balance: ${balErr.message}`);
        }
      } else {
        throw err;
      }
    }
  } else {
    throw new Error(`Exchange ${exchangeId} does not support fetching trades via API.`);
  }

  if (ccxtTrades.length === 0) {
    // Update last sync time anyway
    await prisma.account.update({
      where: { id: accountId },
      data: { last_sync_at: new Date() },
    });
    return result;
  }

  // 4. Batch query existing tickets to avoid duplicate insertion errors
  const incomingTickets = ccxtTrades.map(t => stringToHash(t.id));
  const existingTrades = await prisma.trade.findMany({
    where: {
      account_id: accountId,
      ticket: { in: incomingTickets },
    },
    select: { ticket: true },
  });

  const existingTicketsSet = new Set(existingTrades.map(t => t.ticket));

  // 5. Process trades
  for (const trade of ccxtTrades) {
    const ticket = stringToHash(trade.id);
    if (existingTicketsSet.has(ticket)) {
      result.skipped++;
      continue;
    }

    try {
      let profitUsd = 0;
      if (trade.info) {
        const info = trade.info;
        const pnl = info.realizedPnl || info.realizedPnL || info.pnl || info.pL || info.profit || info.closedPnl;
        if (pnl !== undefined) {
          profitUsd = parseFloat(pnl);
        }
      }

      let commission = 0;
      if (trade.fee && typeof trade.fee.cost === 'number') {
        commission = trade.fee.cost;
      }

      await prisma.trade.create({
        data: {
          account_id: accountId,
          user_id: userId,
          symbol: trade.symbol,
          direction: trade.side.toUpperCase() as 'BUY' | 'SELL',
          open_time: new Date(trade.timestamp),
          close_time: new Date(trade.timestamp),
          open_price: trade.price,
          close_price: trade.price,
          lot_size: trade.amount,
          profit_usd: profitUsd,
          commission: commission,
          swap: 0,
          pips: 0,
          r_multiple: 0,
          ticket: ticket,
          import_source: 'CRYPTO_API' as any,
        },
      });

      result.created++;
    } catch (err: any) {
      result.errors.push(`Trade ${trade.id} failed: ${err.message}`);
    }
  }

  // 6. Update last sync time
  await prisma.account.update({
    where: { id: accountId },
    data: { last_sync_at: new Date() },
  });

  return result;
}
