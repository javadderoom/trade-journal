import React from 'react';
import TradeInspectPage from '../../../../components/trades/TradeInspectPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return <TradeInspectPage tradeId={id} />;
}
