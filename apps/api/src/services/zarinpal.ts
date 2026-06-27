import crypto from 'node:crypto';

interface ZarinPalRequestResponse {
  data?: {
    code: number;
    message: string;
    authority: string;
  };
  errors?: any;
}

interface ZarinPalVerifyResponse {
  data?: {
    code: number;
    message: string;
    ref_id: number;
  };
  errors?: any;
}

const getBaseUrl = (): string => {
  const isSandbox = process.env.ZARINPAL_SANDBOX === 'true';
  return isSandbox ? 'https://sandbox.zarinpal.com/pg/v4' : 'https://api.zarinpal.com/pg/v4';
};

const getGatewayUrl = (authority: string): string => {
  const isSandbox = process.env.ZARINPAL_SANDBOX === 'true';
  return isSandbox
    ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
    : `https://www.zarinpal.com/pg/StartPay/${authority}`;
};

/**
 * Request payment session from ZarinPal
 */
export async function requestPayment(
  amountInTomans: number,
  description: string,
  callbackUrl: string,
  metadata: { email?: string; phone?: string } = {}
): Promise<{ authority: string; redirectUrl: string }> {
  const isMock = process.env.MOCK_PAYMENT === 'true';

  if (isMock) {
    const mockAuthority = `MOCK-AUTH-${crypto.randomUUID()}`;
    // Redirect to our own mock-gateway endpoint in the API (which the frontend can load)
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const redirectUrl = `${apiBase}/api/payments/mock-gateway?Authority=${mockAuthority}&Amount=${amountInTomans}&CallbackUrl=${encodeURIComponent(callbackUrl)}`;
    return {
      authority: mockAuthority,
      redirectUrl,
    };
  }

  const merchantId = process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000';
  const url = `${getBaseUrl()}/payment/request.json`;

  const payload = {
    merchant_id: merchantId,
    // ZarinPal API expects Tomans (in some updates Rials, but v4 is usually Rials or Tomans depending on settings, standard is Tomans. Let's assume Tomans)
    amount: amountInTomans,
    callback_url: callbackUrl,
    description,
    metadata: {
      email: metadata.email || undefined,
      mobile: metadata.phone || undefined,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as ZarinPalRequestResponse;

    if (body.errors && Object.keys(body.errors).length > 0) {
      const errDetail = JSON.stringify(body.errors);
      throw new Error(`ZarinPal request error: ${errDetail}`);
    }

    if (body.data && body.data.code === 100) {
      return {
        authority: body.data.authority,
        redirectUrl: getGatewayUrl(body.data.authority),
      };
    }

    throw new Error(`ZarinPal request failed with code ${body.data?.code}: ${body.data?.message}`);
  } catch (err: any) {
    console.error('ZarinPal request payment failed:', err);
    throw err;
  }
}

/**
 * Verify payment with ZarinPal
 */
export async function verifyPayment(
  amountInTomans: number,
  authority: string
): Promise<{ success: boolean; refId: string; message: string }> {
  const isMock = process.env.MOCK_PAYMENT === 'true' || authority.startsWith('MOCK-AUTH-');

  if (isMock) {
    return {
      success: true,
      refId: Math.floor(10000000 + Math.random() * 90000000).toString(),
      message: 'پرداخت آزمایشی با موفقیت تایید شد (Mock Mode)',
    };
  }

  const merchantId = process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000';
  const url = `${getBaseUrl()}/payment/verify.json`;

  const payload = {
    merchant_id: merchantId,
    amount: amountInTomans,
    authority,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as ZarinPalVerifyResponse;

    if (body.errors && Object.keys(body.errors).length > 0) {
      const errDetail = JSON.stringify(body.errors);
      throw new Error(`ZarinPal verification error: ${errDetail}`);
    }

    if (body.data && (body.data.code === 100 || body.data.code === 101)) {
      return {
        success: true,
        refId: body.data.ref_id.toString(),
        message: body.data.code === 101 ? 'پرداخت قبلا تایید شده است' : 'پرداخت با موفقیت تایید شد',
      };
    }

    return {
      success: false,
      refId: '',
      message: body.data?.message || `تایید پرداخت با خطا مواجه شد (کد ${body.data?.code})`,
    };
  } catch (err: any) {
    console.error('ZarinPal verify payment failed:', err);
    return {
      success: false,
      refId: '',
      message: err.message || 'خطای شبکه در تایید پرداخت',
    };
  }
}
