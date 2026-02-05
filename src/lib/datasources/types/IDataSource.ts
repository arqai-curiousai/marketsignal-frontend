import { ISignal } from '../../../types';

/**
 * Interface that all data source adapters must implement.
 * This enables the adapter pattern for extensible data integration.
 */
export interface IDataSource {
  readonly name: string;
  readonly type: 'NEWS' | 'MARKET_DATA' | 'EARNINGS' | 'MACRO' | 'SENTIMENT';
  readonly enabled: boolean;

  /**
   * Initialize the data source connection
   */
  initialize(): Promise<void>;

  /**
   * Fetch signals from this data source
   * @param limit - Maximum number of signals to return
   */
  fetchSignals(limit?: number): Promise<ISignal[]>;

  /**
   * Check if the data source is healthy and responding
   */
  healthCheck(): Promise<boolean>;

  /**
   * Clean up resources
   */
  disconnect(): Promise<void>;
}
