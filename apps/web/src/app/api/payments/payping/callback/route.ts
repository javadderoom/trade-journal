import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const plan = url.searchParams.get('plan');
    const period = url.searchParams.get('period');
    const amount = url.searchParams.get('amount');
    const discountCode = url.searchParams.get('discountCode');

    // Parse x-www-form-urlencoded body
    const formData = await request.formData();
    const status = formData.get('status');
    const errorCode = formData.get('errorCode');
    const dataStr = formData.get('data');

    let refid = formData.get('refid') || formData.get('paymentRefId');
    let code = formData.get('code') || formData.get('paymentCode');

    if (dataStr) {
      try {
        const parsedData = JSON.parse(dataStr.toString());
        if (parsedData) {
          refid = refid || parsedData.paymentRefId;
          code = code || parsedData.paymentCode;
        }
      } catch (e) {
        console.error('[PayPing Route Handler] Error parsing data:', e);
      }
    }

    const webBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    const redirectUrl = new URL(`${webBase}/payments/callback`);
    
    if (plan) redirectUrl.searchParams.set('plan', plan);
    if (period) redirectUrl.searchParams.set('period', period);
    if (amount) redirectUrl.searchParams.set('amount', amount);
    if (discountCode) redirectUrl.searchParams.set('discountCode', discountCode);
    redirectUrl.searchParams.set('gateway', 'payping');
    
    if (refid) redirectUrl.searchParams.set('refid', refid.toString());
    if (code) redirectUrl.searchParams.set('code', code.toString());
    if (status) redirectUrl.searchParams.set('status', status.toString());

    console.log('[PayPing Route Handler] Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (err) {
    console.error('Error in PayPing frontend callback route:', err);
    const webBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${webBase}/payments/callback?gateway=payping&error=route_handler_failed`, 303);
  }
}

// Support GET redirects just in case PayPing changes it
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const plan = url.searchParams.get('plan');
    const period = url.searchParams.get('period');
    const amount = url.searchParams.get('amount');
    const discountCode = url.searchParams.get('discountCode');
    const refid = url.searchParams.get('refid') || url.searchParams.get('paymentRefId');
    const code = url.searchParams.get('code') || url.searchParams.get('paymentCode');
    const status = url.searchParams.get('status');

    const webBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    const redirectUrl = new URL(`${webBase}/payments/callback`);
    
    if (plan) redirectUrl.searchParams.set('plan', plan);
    if (period) redirectUrl.searchParams.set('period', period);
    if (amount) redirectUrl.searchParams.set('amount', amount);
    if (discountCode) redirectUrl.searchParams.set('discountCode', discountCode);
    redirectUrl.searchParams.set('gateway', 'payping');
    
    if (refid) redirectUrl.searchParams.set('refid', refid);
    if (code) redirectUrl.searchParams.set('code', code);
    if (status) redirectUrl.searchParams.set('status', status);

    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (err) {
    console.error('Error in PayPing frontend GET callback route:', err);
    const webBase = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${webBase}/payments/callback?gateway=payping&error=route_handler_failed`, 303);
  }
}
