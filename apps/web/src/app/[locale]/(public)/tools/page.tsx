import React from 'react';
import { Metadata } from 'next';
import PipCalculator from '../../../../components/tools/PipCalculator';
import './tools.scss';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const isEn = resolvedParams.locale === 'en';
  
  return {
    title: isEn ? 'Free Forex Pip Calculator | TradeKav Tools' : 'ماشین حساب پیپ فارکس | ابزارهای تریدکاو',
    description: isEn 
      ? 'Calculate the exact value of a pip in your account currency for major forex pairs and gold (XAUUSD).' 
      : 'محاسبه دقیق ارزش هر پیپ در فارکس بر اساس ارز حساب شما. پشتیبانی از جفت‌ارزهای اصلی و طلا.',
  };
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const isEn = resolvedParams.locale === 'en';
  
  const title = isEn ? 'Forex Pip Calculator' : 'ماشین حساب پیپ فارکس';
  const desc = isEn 
    ? 'Calculate the exact value of a pip for any currency pair based on your trade size and account currency.' 
    : 'محاسبه دقیق و سریع ارزش هر پیپ بر اساس ارز پایه حساب شما و حجم معامله (لات).';

  return (
    <main className="tools-page">
      <div className="tools-header">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>

      <PipCalculator isEn={isEn} />
    </main>
  );
}
