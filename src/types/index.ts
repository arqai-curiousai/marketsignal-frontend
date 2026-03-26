// Core domain types for the investment research platform

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

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

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: IAIResponse;
}
