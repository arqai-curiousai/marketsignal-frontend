import { IAIResponse, ISource, ConfidenceLevel } from '../../types';
import { apiClient } from '../api/apiClient';

/**
 * Backend API response types (matching backend ResearchResponse)
 */
interface BackendDocument {
  id: string;
  source: string;
  source_id: string;
  title: string | null;
  content: string | null;
  url: string | null;
  published_at: string | null;
  fetched_at: string | null;
  metadata: Record<string, unknown>;
}

interface BackendDocumentSearchResult {
  document: BackendDocument;
  score: number;
  snippet: string | null;
}

interface BackendResearchResponse {
  answer: string;
  sources: BackendDocumentSearchResult[];
  confidence: number;
  disclaimer: string;
}

interface BackendResearchRequest {
  question: string;
  context_filter?: Record<string, unknown>;
  max_sources?: number;
}

/**
 * AI Client for MarketSignal AI
 * Connects to backend RAG-powered Q&A API with strict compliance filtering.
 */
export class AIClient {
  /**
   * Ask a question and get a response from backend RAG system
   */
  async ask(question: string, context?: Record<string, unknown>): Promise<IAIResponse> {
    const requestBody: BackendResearchRequest = {
      question,
      max_sources: 5,
      context_filter: context,
    };

    const result = await apiClient.post<BackendResearchResponse>(
      '/api/research/ask',
      requestBody
    );

    if (!result.success) {
      console.error('Backend research API error:', result.error);
      // Return error response
      return {
        answer: `I apologize, but I encountered an error processing your question. ${result.error.detail || 'Please try again later.'}`,
        summary: ['Error processing request'],
        sources: [],
        confidence: 'LOW',
        timestamp: new Date(),
        metadata: {
          error: true,
          errorMessage: result.error.message,
        },
      };
    }

    // Map backend response to frontend IAIResponse
    const backendData = result.data;

    return {
      answer: backendData.answer,
      summary: this.extractSummaryFromAnswer(backendData.answer),
      sources: this.mapSources(backendData.sources),
      confidence: this.mapConfidence(backendData.confidence),
      timestamp: new Date(),
      metadata: {
        model: 'marketsignal-rag-v1',
        disclaimer: backendData.disclaimer,
      },
    };
  }

  /**
   * Extract key points from the answer as summary bullets
   */
  private extractSummaryFromAnswer(answer: string): string[] {
    // Extract bullet points if present, otherwise take first 2 sentences
    const bulletMatch = answer.match(/[•\-*]\s*([^\n•\-*]+)/g);
    if (bulletMatch && bulletMatch.length > 0) {
      return bulletMatch.slice(0, 3).map(b => b.replace(/^[•\-*]\s*/, '').trim());
    }

    // Fallback: split into sentences and take first 3
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * Map backend sources to frontend ISource format
   */
  private mapSources(backendSources: BackendDocumentSearchResult[]): ISource[] {
    return backendSources.map(src => ({
      id: src.document.id,
      title: src.document.title || 'Untitled Source',
      url: src.document.url || '#',
      publisher: src.document.source || 'Unknown',
      publishedAt: src.document.published_at
        ? new Date(src.document.published_at)
        : new Date(),
      relevanceScore: Math.round(src.score * 100),
    }));
  }

  /**
   * Map backend confidence (0-1) to frontend ConfidenceLevel
   */
  private mapConfidence(confidence: number): ConfidenceLevel {
    if (confidence >= 0.8) return 'VERY_HIGH';
    if (confidence >= 0.6) return 'HIGH';
    if (confidence >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

}

export const aiClient = new AIClient();
