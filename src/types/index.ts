// Core domain types for the investment research platform

export type SignalType = 'MACRO' | 'SECTOR' | 'CORRELATION' | 'VOLATILITY' | 'EVENT' | 'EARNINGS';
export type SignalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface ISignal {
  id: string;
  type: SignalType;
  title: string;
  summary: string;
  description: string;
  severity: SignalSeverity;
  confidence: ConfidenceLevel;
  timestamp: Date;
  sources: ISource[];
  metadata: Record<string, unknown>;
  impactScore: number; // 0-100
  correlatedInstruments?: string[];
}

export interface ISource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: Date;
  relevanceScore: number; // 0-100
}

export interface IAIResponse {
  answer: string;
  summary: string[];
  sources: ISource[];
  confidence: ConfidenceLevel;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface IResearchItem {
  id: string;
  type: 'COMPANY' | 'SECTOR' | 'EVENT' | 'MACRO';
  title: string;
  description: string;
  insights: string[];
  lastUpdated: Date;
  tags: string[];
}

export interface IDataSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'NEWS' | 'MARKET_DATA' | 'EARNINGS' | 'MACRO' | 'SENTIMENT';
  refreshInterval: number; // in minutes
}

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: IAIResponse;
}
