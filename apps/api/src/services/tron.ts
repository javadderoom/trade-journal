interface VerificationResult {
  isValid: boolean;
  amount?: number; // USD value
  error?: string;
}

export async function verifyTronTransaction(
  txHash: string,
  coin: 'USDT' | 'TRX',
  expectedAmount: number, // Required USD price
  config: { usdtAddress: string; trxAddress: string }
): Promise<VerificationResult> {
  // Support mock transactions in development/testing
  if (txHash.startsWith('MOCK-TX-')) {
    return { isValid: true, amount: expectedAmount };
  }

  try {
    const url = `https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { isValid: false, error: 'خطا در دریافت اطلاعات تراکنش از شبکه ترون' };
    }

    const txData = await res.json() as any;

    if (!txData || Object.keys(txData).length === 0) {
      return { isValid: false, error: 'تراکنش در شبکه ترون یافت نشد' };
    }

    if (txData.contractRet !== 'SUCCESS') {
      return { isValid: false, error: 'تراکنش در شبکه با خطا مواجه شده است' };
    }

    if (txData.confirmed === false) {
      return { isValid: false, error: 'تراکنش هنوز در شبکه ترون تایید (Confirmed) نشده است' };
    }

    if (coin === 'USDT') {
      const transfers = txData.trc20TransferInfo || [];
      // USDT TRC-20 Contract address: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
      const usdtTransfer = transfers.find((t: any) => 
        t.contract_address === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' &&
        t.symbol === 'USDT' &&
        t.to_address.toLowerCase() === config.usdtAddress.toLowerCase()
      );

      if (!usdtTransfer) {
        return { isValid: false, error: `تراکنش انتقال USDT معتبری به آدرس گیرنده ${config.usdtAddress} یافت نشد` };
      }

      // USDT has 6 decimal places
      const actualAmount = parseFloat(usdtTransfer.amount_str) / 1000000;
      if (actualAmount < expectedAmount) {
        return { isValid: false, error: `مبلغ واریزی (${actualAmount} USDT) کمتر از هزینه پلن (${expectedAmount} USDT) است` };
      }

      return { isValid: true, amount: actualAmount };
    } else {
      // TRX
      const transferInfo = txData.transferInfo;
      if (!transferInfo || transferInfo.toAddress.toLowerCase() !== config.trxAddress.toLowerCase()) {
        return { isValid: false, error: `تراکنش انتقال TRX معتبری به آدرس گیرنده ${config.trxAddress} یافت نشد` };
      }

      // TRX has 6 decimal places
      const actualTrx = transferInfo.amount / 1000000;

      // Fetch TRX price dynamically from CoinGecko with a timeout
      let trxPriceUsd = 0.12; // Fallback price
      try {
        const priceController = new AbortController();
        const priceTimeoutId = setTimeout(() => priceController.abort(), 5000);
        const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd', {
          signal: priceController.signal,
        });
        clearTimeout(priceTimeoutId);
        if (priceRes.ok) {
          const priceData = await priceRes.json() as any;
          if (priceData?.tron?.usd) {
            trxPriceUsd = priceData.tron.usd;
          }
        }
      } catch (priceErr) {
        console.error('Failed to fetch dynamic TRX price from CoinGecko, using fallback:', priceErr);
      }

      const actualAmount = actualTrx * trxPriceUsd;
      if (actualAmount < expectedAmount) {
        return { isValid: false, error: `مبلغ TRX واریزی معادل $${actualAmount.toFixed(2)} کمتر از هزینه پلن $${expectedAmount.toFixed(2)} است` };
      }

      return { isValid: true, amount: actualAmount };
    }
  } catch (err: any) {
    console.error('Verify Tron transaction error:', err);
    if (err.name === 'AbortError') {
      return { isValid: false, error: 'زمان بررسی تراکنش به پایان رسید. لطفا دوباره تلاش کنید' };
    }
    return { isValid: false, error: 'خطا در برقراری ارتباط با شبکه ترون' };
  }
}
