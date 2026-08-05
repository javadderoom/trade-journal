import React from 'react';
import TradeReviewPage from '../../../../components/trades/TradeReviewPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return <TradeReviewPage tradeId={id} />;
}
