import { Router, Response } from 'express';
import ccxt from 'ccxt';
import { prisma } from '../services/tradeSync';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkCryptoPermission, checkAccountLimit } from '../middleware/checkPlanLimits';
import { encrypt } from '../lib/encryption';
import { testConnection, syncExchangeTrades } from '../services/ccxtSync';

const router = Router();

// GET /api/crypto/exchanges - List all CCXT supported exchanges
router.get('/exchanges', authenticate, checkCryptoPermission, async (req: AuthRequest, res: Response) => {
  try {
    // Return all CCXT exchanges
    return res.status(200).json({ exchanges: ccxt.exchanges });
  } catch (err: any) {
    console.error('List exchanges error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در دریافت لیست صرافی‌ها' });
  }
});

// POST /api/crypto/connect - Connect an exchange, verify credentials, and auto-create a dedicated Account
router.post('/connect', authenticate, checkCryptoPermission, checkAccountLimit, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { exchangeId, apiKey, apiSecret, passphrase, accountName } = req.body;

    if (!exchangeId || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'اطلاعات مورد نیاز (شناسه صرافی، کلید API و رمز API) ارسال نشده است.' });
    }

    // 1. Verify connection credentials
    try {
      await testConnection({ exchangeId, apiKey, apiSecret, passphrase });
    } catch (connErr: any) {
      return res.status(400).json({ error: `خطا در اتصال به صرافی: ${connErr.message}` });
    }

    // 2. Create the Account & ExchangeConnection inside a transaction (or sequentially)
    const displayName = accountName || `${exchangeId.charAt(0).toUpperCase()}${exchangeId.slice(1)} API`;
    
    const account = await prisma.$transaction(async (tx) => {
      const newAcc = await tx.account.create({
        data: {
          user_id: userId,
          broker_name: displayName,
          account_number: 'API Connection',
          currency: 'USD',
        },
      });

      await tx.exchangeConnection.create({
        data: {
          account_id: newAcc.id,
          exchange_id: exchangeId,
          api_key: encrypt(apiKey),
          api_secret: encrypt(apiSecret),
          passphrase: passphrase ? encrypt(passphrase) : null,
        },
      });

      return newAcc;
    });

    // 3. Trigger initial trade sync in the background so trades are populated immediately
    syncExchangeTrades(userId, account.id).catch(err => {
      console.error(`Initial background sync failed for account ${account.id}:`, err);
    });

    return res.status(201).json({
      message: 'اتصال صرافی با موفقیت برقرار شد و حساب جدید ایجاد گردید.',
      account,
    });
  } catch (err: any) {
    console.error('Connect exchange error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در اتصال به صرافی' });
  }
});

// POST /api/crypto/sync/:accountId - Manually trigger sync for a connected exchange
router.post('/sync/:accountId', authenticate, checkCryptoPermission, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.accountId as string;

    const syncResult = await syncExchangeTrades(userId, accountId);
    return res.status(200).json({
      message: 'همگام‌سازی صرافی با موفقیت انجام شد.',
      ...syncResult,
    });
  } catch (err: any) {
    console.error('Sync exchange trades error:', err);
    return res.status(500).json({ error: `خطا در همگام‌سازی صرافی: ${err.message}` });
  }
});

// DELETE /api/crypto/disconnect/:accountId - Disconnect/remove exchange credentials
router.delete('/disconnect/:accountId', authenticate, checkCryptoPermission, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.accountId as string;

    // Verify ownership
    const connection = await prisma.exchangeConnection.findFirst({
      where: { account_id: accountId, account: { user_id: userId } },
    });

    if (!connection) {
      return res.status(404).json({ error: 'اتصال صرافی برای این حساب یافت نشد.' });
    }

    // Delete credentials (cascades or single delete)
    await prisma.exchangeConnection.delete({
      where: { id: connection.id },
    });

    // Optionally mark the account broker_name to indicate disconnected API
    await prisma.account.update({
      where: { id: accountId },
      data: { account_number: 'API Connection (Disconnected)' },
    });

    return res.status(200).json({ message: 'اتصال صرافی با موفقیت قطع شد. معاملات قبلی حفظ خواهند شد.' });
  } catch (err: any) {
    console.error('Disconnect exchange error:', err);
    return res.status(500).json({ error: 'خطای داخلی سرور در قطع اتصال صرافی' });
  }
});

export default router;
