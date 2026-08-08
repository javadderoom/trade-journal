import { Trade, TradeAnnotation, TradeSetup, TradingConcept } from '@prisma/client';

export interface CommunityTradePreview {
    id: string;
    symbol: string;
    direction: 'BUY' | 'SELL';
    entryPrice: number;
    stopLoss: number | null;
    takeProfit: number | null;
    exitPrice: number | null;
    entryTime: Date;
    exitTime: Date | null;
    resultR: number;
    riskReward: number | null;
    setup: { id: string; name: string } | null;
    entryTimeframe: string | null;
    analysisTimeframe: string | null;
    images: { id: string; url: string }[];
}

type FullTrade = Trade & {
    annotation?: TradeAnnotation | null;
    setup?: (TradeSetup & { concept: TradingConcept }) | null;
};

export const mapTradeToCommunityPreview = (trade: FullTrade): CommunityTradePreview => {
    let riskReward: number | null = null;
    if (trade.take_profit && trade.stop_loss && trade.open_price !== trade.stop_loss) {
        riskReward = Math.abs(trade.take_profit - trade.open_price) / Math.abs(trade.open_price - trade.stop_loss);
        // round to 2 decimals
        riskReward = Math.round(riskReward * 100) / 100;
    }

    const images = trade.annotation?.screenshots?.map((url, index) => ({
        id: `${trade.id}-img-${index}`,
        url
    })) || [];

    return {
        id: trade.id,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.open_price,
        stopLoss: trade.stop_loss,
        takeProfit: trade.take_profit,
        exitPrice: trade.close_price,
        entryTime: trade.open_time,
        exitTime: trade.close_time,
        resultR: trade.r_multiple,
        riskReward,
        setup: trade.setup ? { id: trade.setup.concept.id, name: trade.setup.concept.name } : null,
        entryTimeframe: trade.annotation?.entry_timeframe || null,
        analysisTimeframe: trade.annotation?.analysis_timeframe || null,
        images
    };
};
