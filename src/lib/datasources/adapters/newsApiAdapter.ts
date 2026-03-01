import { IDataSource } from '../types/IDataSource';
import { ISignal } from '../../../types';
import { apiClient } from '../../api/client';

/**
 * News API Adapter
 * Fetches news-based signals from the backend API
 */
export class NewsApiAdapter implements IDataSource {
  readonly name = 'NewsAPI';
  readonly type = 'NEWS' as const;
  readonly enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  async initialize(): Promise<void> {
    // No-op: backend handles initialization
  }

  async fetchSignals(limit: number = 10): Promise<ISignal[]> {
    try {
      const result = await apiClient.get<{ items?: ISignal[] }>('/api/signals', {
        signal_type: 'SENTIMENT_SHIFT',
        page_size: limit,
      });
      if (result.success) {
        return result.data.items ?? [];
      }
      return [];
    } catch {
      console.warn('NewsApiAdapter: failed to fetch signals from backend');
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await apiClient.get<{ status: string }>('/health');
      return result.success;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // No-op
  }
}
