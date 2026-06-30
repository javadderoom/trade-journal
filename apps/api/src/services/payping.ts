import crypto from 'node:crypto';

interface PayPingRequestResponse {
  code?: string;
  paymentCode?: string;
  url?: string;
  [key: string]: any;
}

const getBaseUrl = (): string => {
  return 'https://api.payping.ir/v3/pay';
};

/**
 * Request payment session from PayPing
 */
export async function requestPaypingPayment(
  amountInTomans: number,
  description: string,
  callbackUrl: string,
  metadata: { email?: string; phone?: string } = {}
): Promise<{ code: string; redirectUrl: string }> {
  const isMock = process.env.MOCK_PAYMENT === 'true';

  if (isMock) {
    const mockCode = `MOCK-PAYPING-${crypto.randomUUID()}`;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const redirectUrl = `${apiBase}/api/payments/payping/mock-gateway?Code=${mockCode}&Amount=${amountInTomans}&CallbackUrl=${encodeURIComponent(callbackUrl)}`;
    return {
      code: mockCode,
      redirectUrl,
    };
  }

  const token = process.env.PAYPING_TOKEN;
  if (!token) {
    throw new Error('PayPing API Token (PAYPING_TOKEN) is not configured.');
  }

  const url = getBaseUrl();
  const payload = {
    amount: amountInTomans,
    payerIdentity: metadata.email || metadata.phone || undefined,
    description,
    returnUrl: callbackUrl,
    clientRefId: crypto.randomUUID(),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`PayPing request failed: ${response.status} - ${errText}`);
    }

    const body = (await response.json()) as PayPingRequestResponse;

    const paymentCode = body.paymentCode || body.code;
    const redirectUrl = body.url || `https://api.payping.ir/v3/pay/start/${paymentCode}`;

    if (body && paymentCode) {
      return {
        code: paymentCode,
        redirectUrl: redirectUrl,
      };
    }

    throw new Error(`PayPing request failed: No code returned in response.`);
  } catch (err: any) {
    console.error('PayPing request payment failed:', err);
    throw err;
  }
}

/**
 * Verify payment with PayPing
 */
export async function verifyPaypingPayment(
  amountInTomans: number,
  paymentCode: string,
  paymentRefId: number
): Promise<{ success: boolean; refId: string; message: string; data?: any }> {
  const isMock = process.env.MOCK_PAYMENT === 'true' || paymentCode.startsWith('MOCK-PAYPING-');

  if (isMock) {
    return {
      success: true,
      refId: paymentCode.startsWith('MOCK-PAYPING-') ? paymentCode.replace('MOCK-PAYPING-', '') : paymentCode,
      message: 'پرداخت آزمایشی پی‌پینگ با موفقیت تایید شد (Mock Mode)',
    };
  }

  const token = process.env.PAYPING_TOKEN;
  if (!token) {
    throw new Error('PayPing API Token (PAYPING_TOKEN) is not configured.');
  }

  const url = `${getBaseUrl()}/verify`;
  const payload = {
    paymentRefId: Number(paymentRefId),
    paymentCode: paymentCode,
    amount: amountInTomans,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 200) {
      const body = await response.json();
      return {
        success: true,
        refId: body.paymentRefId?.toString() || paymentRefId.toString(),
        message: 'پرداخت با موفقیت تایید شد',
        data: body,
      };
    }

    const errText = await response.text();
    return {
      success: false,
      refId: '',
      message: `تایید پرداخت پی‌پینگ با خطا مواجه شد: ${response.status} - ${errText}`,
    };
  } catch (err: any) {
    console.error('PayPing verify payment failed:', err);
    return {
      success: false,
      refId: '',
      message: err.message || 'خطای شبکه در تایید پرداخت پی‌پینگ',
    };
  }
}
