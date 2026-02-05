import { IDataSource } from '../types/IDataSource';
import { ISignal, SignalType, SignalSeverity, ConfidenceLevel } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock News API Adapter
 * Demonstrates adapter pattern implementation for news-based signals
 */
export class NewsApiAdapter implements IDataSource {
  readonly name = 'NewsAPI';
  readonly type = 'NEWS' as const;
  readonly enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  async initialize(): Promise<void> {
    // Mock initialization
    // console.log(`${this.name} adapter initialized`);
  }

  async fetchSignals(limit: number = 10): Promise<ISignal[]> {
    // Mock signal data
    const mockSignals: ISignal[] = [
      {
        id: uuidv4(),
        type: 'MACRO' as SignalType,
        title: 'Federal Reserve Signals Potential Rate Adjustment',
        summary: 'Fed officials indicate possible policy shift in Q3 amid inflation concerns',
        description: 'Multiple Federal Reserve officials have suggested a potential adjustment to interest rate policy in the coming quarter, citing persistent inflation concerns and labor market dynamics.',
        severity: 'HIGH' as SignalSeverity,
        confidence: 'HIGH' as ConfidenceLevel,
        timestamp: new Date(),
        impactScore: 85,
        sources: [
          {
            id: uuidv4(),
            title: 'Fed Officials Hint at Policy Change',
            url: 'https://example.com/fed-policy',
            publisher: 'Financial Times',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            relevanceScore: 95
          },
          {
            id: uuidv4(),
            title: 'Central Bank Signals Shift',
            url: 'https://example.com/central-bank',
            publisher: 'Wall Street Journal',
            publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            relevanceScore: 90
          }
        ],
        metadata: {
          region: 'US',
          sector: 'ALL'
        },
        correlatedInstruments: ['SPY', 'TLT', 'DXY']
      },
      {
        id: uuidv4(),
        type: 'SECTOR' as SignalType,
        title: 'Technology Sector Shows Unusual Volatility Spike',
        summary: 'Tech stocks exhibit elevated volatility following earnings reports',
        description: 'Major technology stocks have experienced significant volatility following mixed earnings reports, with particular concern around AI infrastructure spending.',
        severity: 'MEDIUM' as SignalSeverity,
        confidence: 'MEDIUM' as ConfidenceLevel,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        impactScore: 68,
        sources: [
          {
            id: uuidv4(),
            title: 'Tech Earnings Drive Volatility',
            url: 'https://example.com/tech-volatility',
            publisher: 'Bloomberg',
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            relevanceScore: 85
          }
        ],
        metadata: {
          sector: 'TECHNOLOGY'
        },
        correlatedInstruments: ['QQQ', 'MSFT', 'NVDA', 'META']
      },
      {
        id: uuidv4(),
        type: 'CORRELATION' as SignalType,
        title: 'Emerging Markets Correlation Breakdown Detected',
        summary: 'Historical correlation patterns between EM and developed markets weakening',
        description: 'Statistical analysis reveals a significant breakdown in traditional correlation patterns between emerging market indices and developed market benchmarks.',
        severity: 'MEDIUM' as SignalSeverity,
        confidence: 'HIGH' as ConfidenceLevel,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        impactScore: 72,
        sources: [
          {
            id: uuidv4(),
            title: 'EM-DM Correlation Analysis',
            url: 'https://example.com/correlation',
            publisher: 'Reuters',
            publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
            relevanceScore: 88
          }
        ],
        metadata: {
          region: 'GLOBAL'
        },
        correlatedInstruments: ['EEM', 'VWO', 'SPY']
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
