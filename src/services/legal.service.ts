import { API_CONFIG } from '@/lib/api/config';
import { apiRequest } from '@/lib/api/client';
import { LegalSource } from '@/lib/types';

/**
 * Legal Service
 * Handles legal document search and retrieval
 * Single Responsibility: Managing legal data operations
 */
export class LegalService {
  /**
   * Search for legal documents
   */
  async searchLegal(query: string, filters?: SearchFilters): Promise<SearchResult> {
    return apiRequest<SearchResult>({
      method: 'POST',
      url: API_CONFIG.endpoints.legal.search,
      data: {
        query,
        filters,
        limit: filters?.limit || 10,
      },
    });
  }

  /**
   * Get case law by ID
   */
  async getCaseById(caseId: string): Promise<CaseLaw> {
    return apiRequest<CaseLaw>({
      method: 'GET',
      url: `${API_CONFIG.endpoints.legal.cases}/${caseId}`,
    });
  }

  /**
   * Get statute by ID
   */
  async getStatuteById(statuteId: string): Promise<Statute> {
    return apiRequest<Statute>({
      method: 'GET',
      url: `${API_CONFIG.endpoints.legal.statutes}/${statuteId}`,
    });
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(policyId: string): Promise<Policy> {
    return apiRequest<Policy>({
      method: 'GET',
      url: `${API_CONFIG.endpoints.legal.policies}/${policyId}`,
    });
  }

  /**
   * Get related documents
   */
  async getRelatedDocuments(documentId: string, type: LegalSource['type']): Promise<LegalSource[]> {
    return apiRequest<LegalSource[]>({
      method: 'GET',
      url: `${API_CONFIG.endpoints.legal.search}/related`,
      params: {
        document_id: documentId,
        document_type: type,
      },
    });
  }
}

// Type definitions for legal service
export interface SearchFilters {
  type?: LegalSource['type'][];
  dateFrom?: string;
  dateTo?: string;
  jurisdiction?: string;
  court?: string;
  limit?: number;
}

export interface SearchResult {
  results: LegalSource[];
  totalCount: number;
  facets: {
    type: Record<string, number>;
    jurisdiction: Record<string, number>;
    year: Record<string, number>;
  };
}

export interface CaseLaw extends LegalSource {
  court: string;
  judges: string[];
  parties: {
    petitioner: string;
    respondent: string;
  };
  headnotes: string[];
  fullText: string;
}

export interface Statute extends LegalSource {
  sections: StatuteSection[];
  amendments: Amendment[];
  effectiveDate: string;
}

export interface StatuteSection {
  number: string;
  title: string;
  content: string;
  subsections?: StatuteSection[];
}

export interface Amendment {
  date: string;
  description: string;
  sections: string[];
}

export interface Policy extends LegalSource {
  department: string;
  category: string;
  summary: string;
  provisions: string[];
  applicability: string;
}

// Export singleton instance
export const legalService = new LegalService(); 