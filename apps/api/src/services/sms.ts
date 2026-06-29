import axios from 'axios';

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_OTP_TEMPLATE;

  // Format phone number to start with 0 if it doesn't already, e.g. converting +98912 to 0912
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('+98')) {
    formattedPhone = '0' + formattedPhone.substring(3);
  } else if (formattedPhone.startsWith('98')) {
    formattedPhone = '0' + formattedPhone.substring(2);
  }

  // Fallback to mock mode in local/development environments if Kavenegar key is missing
  if (!apiKey || apiKey.includes('00000000') || apiKey === 'mock') {
    console.log(`\n==================================================`);
    console.log(`[MOCK SMS SERVICE]`);
    console.log(`To: ${formattedPhone}`);
    console.log(`Verification Code: ${code}`);
    console.log(`Template: ${template || 'not-set'}`);
    console.log(`==================================================\n`);
    return true;
  }

  if (!template) {
    console.error('Kavenegar OTP Template is not set in environment variables (KAVENEGAR_OTP_TEMPLATE).');
    return false;
  }

  try {
    const response = await axios.post(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      null,
      {
        params: {
          receptor: formattedPhone,
          token: code,
          template: template,
        },
      }
    );

    const status = response.data?.return?.status;
    if (status === 200) {
      console.log(`OTP SMS successfully sent to ${formattedPhone}`);
      return true;
    } else {
      console.error('Kavenegar response error status:', status, response.data);
      return false;
    }
  } catch (err: any) {
    console.error('Failed to send SMS through Kavenegar:', err.response?.data || err.message);
    return false;
  }
}
