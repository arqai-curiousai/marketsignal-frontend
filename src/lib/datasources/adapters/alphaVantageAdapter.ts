import { IDataSource } from '../types/IDataSource';
import { ISignal, SignalType, SignalSeverity, ConfidenceLevel } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock Alpha Vantage Adapter
 * Demonstrates market data adapter implementation
 */
export class AlphaVantageAdapter implements IDataSource {
  readonly name = 'AlphaVantage';
  readonly type = 'MARKET_DATA' as const;
  readonly enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  async initialize(): Promise<void> {
    // console.log(`${this.name} adapter initialized`);
  }

  async fetchSignals(limit: number = 10): Promise<ISignal[]> {
    const mockSignals: ISignal[] = [
      {
        id: uuidv4(),
        type: 'VOLATILITY' as SignalType,
        title: 'VIX Spike Above Historical Average',
        summary: 'Volatility index surges 15% above 30-day moving average',
        description: 'The CBOE Volatility Index has experienced a significant spike, rising 15% above its 30-day moving average, suggesting increased market uncertainty.',
        severity: 'HIGH' as SignalSeverity,
        confidence: 'VERY_HIGH' as ConfidenceLevel,
        timestamp: new Date(),
        impactScore: 78,
        sources: [
          {
            id: uuidv4(),
            title: 'Market Data: VIX Analysis',
            url: 'https://example.com/vix',
            publisher: 'Alpha Vantage',
            publishedAt: new Date(),
            relevanceScore: 95
          }
        ],
        metadata: {
          indicator: 'VIX',
          threshold: '30-day MA'
        }
      },
      {
        id: uuidv4(),
        type: 'EVENT' as SignalType,
        title: 'Unusual Options Activity in Financial Sector',
        summary: 'Significant increase in put option volume for major banks',
        description: 'Market data reveals unusual options activity with put option volume for major financial institutions exceeding historical norms by 200%.',
        severity: 'MEDIUM' as SignalSeverity,
        confidence: 'HIGH' as ConfidenceLevel,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        impactScore: 65,
        sources: [
          {
            id: uuidv4(),
            title: 'Options Flow Analysis',
            url: 'https://example.com/options',
            publisher: 'Alpha Vantage',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            relevanceScore: 82
          }
        ],
        metadata: {
          sector: 'FINANCIALS'
        },
        correlatedInstruments: ['XLF', 'JPM', 'BAC', 'WFC']
      }
    ];

    return mockSignals.slice(0, limit);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    // console.log(`${this.name} adapter disconnected`);
  }
}
