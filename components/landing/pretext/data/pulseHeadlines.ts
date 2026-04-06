export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface HeadlineDef {
  text: string;
  sentiment: Sentiment;
}

export const SENTIMENT_COLORS: Record<Sentiment, string> = {
  bullish: 'rgba(110, 231, 183, 0.8)',
  bearish: 'rgba(248, 113, 113, 0.8)',
  neutral: 'rgba(255, 255, 255, 0.5)',
};

export const SENTIMENT_GLOW: Record<Sentiment, string> = {
  bullish: 'rgba(110, 231, 183, 0.2)',
  bearish: 'rgba(248, 113, 113, 0.2)',
  neutral: 'rgba(255, 255, 255, 0.08)',
};

export const SAMPLE_HEADLINES: HeadlineDef[] = [
  { text: 'Fed signals rate pause amid inflation concerns', sentiment: 'bearish' },
  { text: 'NIFTY hits all-time high on strong FII inflows', sentiment: 'bullish' },
  { text: 'RBI maintains repo rate at 6.5% as expected', sentiment: 'neutral' },
  { text: 'US jobs data beats expectations, yields spike', sentiment: 'bearish' },
  { text: 'Tech rally extends as AI spending accelerates', sentiment: 'bullish' },
  { text: 'China PMI expands for third consecutive month', sentiment: 'bullish' },
  { text: 'ECB cuts rates by 25bps, signals more easing', sentiment: 'bullish' },
  { text: 'Oil slides below $70 on demand concerns', sentiment: 'bearish' },
  { text: 'Japan intervenes as USD/JPY breaches 160', sentiment: 'bearish' },
  { text: 'Gold breaks $2800 as safe-haven demand surges', sentiment: 'bullish' },
  { text: 'UK GDP growth stalls, recession fears mount', sentiment: 'bearish' },
  { text: 'India GDP grows 7.2%, fastest among major economies', sentiment: 'bullish' },
  { text: 'Crypto market cap crosses $4 trillion milestone', sentiment: 'bullish' },
  { text: 'Turkey central bank holds despite lira pressure', sentiment: 'neutral' },
  { text: 'EU imposes new tariffs on Chinese EV imports', sentiment: 'bearish' },
  { text: 'Reliance Q3 profit rises 12% on retail strength', sentiment: 'bullish' },
  { text: 'Global trade volumes contract for second quarter', sentiment: 'bearish' },
  { text: 'Australian unemployment holds steady at 4.1%', sentiment: 'neutral' },
  { text: 'HDFC Bank posts record quarterly profit', sentiment: 'bullish' },
  { text: 'Swiss franc strengthens on geopolitical uncertainty', sentiment: 'neutral' },
  { text: 'Samsung results miss estimates, chip glut persists', sentiment: 'bearish' },
  { text: 'Indian IT sector wins record $40B in new deals', sentiment: 'bullish' },
  { text: 'Brazil raises rates as real weakens past 5.50', sentiment: 'bearish' },
  { text: 'Copper rallies on supply deficit forecasts', sentiment: 'bullish' },
  { text: 'S&P 500 notches 50th record close of the year', sentiment: 'bullish' },
  { text: 'German factory orders decline sharply in March', sentiment: 'bearish' },
  { text: 'Bank of Japan hints at further policy normalization', sentiment: 'neutral' },
  { text: 'TCS wins $2.5B deal with European bank', sentiment: 'bullish' },
  { text: 'US treasury yields invert again, recession signal', sentiment: 'bearish' },
  { text: 'IMF upgrades India growth forecast to 7.0%', sentiment: 'bullish' },
];
