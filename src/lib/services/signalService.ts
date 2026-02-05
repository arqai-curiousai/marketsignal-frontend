import { ISignal } from '../../types';
import { SourceRegistry } from './sourceRegistry';

/**
 * Signal Service - Aggregates and manages signals from multiple data sources.
 * Implements Dependency Injection and Single Responsibility principles.
 */
export class SignalService {
  private registry: SourceRegistry;
  private cache: Map<string, ISignal> = new Map();
  private lastFetchTime: Date | null = null;

  constructor(registry: SourceRegistry) {
    this.registry = registry;
  }

  /**
   * Fetch signals from all enabled data sources
   */
  async fetchAllSignals(limit: number = 20): Promise<ISignal[]> {
    const sources = this.registry.getEnabled();

    if (sources.length === 0) {
      return [];
    }

    try {
      // Fetch from all sources in parallel
      const signalArrays = await Promise.all(
        sources.map(async (source) => {
          try {
            return await source.fetchSignals(Math.ceil(limit / sources.length));
          } catch (error) {
            console.error(`Error fetching from source ${source.name}:`, error);
            return [];
          }
        })
      );

      // Flatten and deduplicate
      const allSignals = signalArrays.flat();
      const deduplicatedSignals = this.deduplicate(allSignals);

      // Sort by impact score and timestamp
      const sortedSignals = this.sortByPriority(deduplicatedSignals);

      // Update cache
      sortedSignals.forEach(signal => this.cache.set(signal.id, signal));
      this.lastFetchTime = new Date();

      return sortedSignals.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch signals from sources:', error);
      return Array.from(this.cache.values()).slice(0, limit);
    }
  }

  /**
   * Get a specific signal by ID
   */
  async getSignalById(id: string): Promise<ISignal | null> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Attempt to refresh if not found
    await this.fetchAllSignals();
    return this.cache.get(id) || null;
  }

  /**
   * Get signals filtered by type
   */
  async getSignalsByType(type: ISignal['type']): Promise<ISignal[]> {
    const allSignals = await this.fetchAllSignals();
    return allSignals.filter(signal => signal.type === type);
  }

  /**
   * Deduplicate signals based on title similarity
   */
  private deduplicate(signals: ISignal[]): ISignal[] {
    const seen = new Set<string>();
    return signals.filter(signal => {
      const key = signal.title.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort signals by priority (impact score and timestamp)
   */
  private sortByPriority(signals: ISignal[]): ISignal[] {
    return [...signals].sort((a, b) => {
      if (a.impactScore !== b.impactScore) {
        return b.impactScore - a.impactScore;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime = null;
  }
}
