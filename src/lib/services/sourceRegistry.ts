import { IDataSource } from '../datasources/types/IDataSource';
import { NewsApiAdapter } from '../datasources/adapters/newsApiAdapter';
import { AlphaVantageAdapter } from '../datasources/adapters/alphaVantageAdapter';

/**
 * Source Registry - Factory pattern for managing data source adapters
 * Implements Open/Closed principle: open for extension, closed for modification
 */
export class SourceRegistry {
  private sources: Map<string, IDataSource> = new Map();

  constructor() {
    this.registerDefaultSources();
  }

  /**
   * Register default data sources
   */
  private registerDefaultSources(): void {
    this.register(new NewsApiAdapter(true));
    this.register(new AlphaVantageAdapter(true));
  }

  /**
   * Register a new data source adapter
   */
  register(source: IDataSource): void {
    this.sources.set(source.name, source);
  }

  /**
   * Get a specific data source by name
   */
  get(name: string): IDataSource | undefined {
    return this.sources.get(name);
  }

  /**
   * Get all registered data sources
   */
  getAll(): IDataSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get only enabled data sources
   */
  getEnabled(): IDataSource[] {
    return this.getAll().filter(source => source.enabled);
  }

  /**
   * Initialize all enabled sources
   */
  async initializeAll(): Promise<void> {
    const promises = this.getEnabled().map(source => source.initialize());
    await Promise.all(promises);
  }

  /**
   * Disconnect all sources
   */
  async disconnectAll(): Promise<void> {
    const promises = this.getAll().map(source => source.disconnect());
    await Promise.all(promises);
  }
}

// Singleton instance
export const sourceRegistry = new SourceRegistry();
