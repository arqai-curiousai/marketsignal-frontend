import { API_CONFIG } from '@/lib/api/config';
import { apiRequest } from '@/lib/api/client';
import { Message, ChatSession, LegalSource } from '@/lib/types';

// Demo mode flag - set to true when backend is not available
const DEMO_MODE = true;

// Demo responses for testing
const DEMO_RESPONSES = [
  {
    content: "I understand you're asking about Indian law. As an AI legal assistant, I can help you with various aspects including:\n\n1. **Constitutional Law** - Fundamental rights, directive principles\n2. **Criminal Law** - IPC sections, criminal procedures\n3. **Civil Law** - Property, contracts, family matters\n4. **Corporate Law** - Company regulations, compliance\n\nWhat specific area would you like to explore?",
    sources: [
      {
        id: "1",
        title: "Constitution of India",
        type: "statute" as const,
        citation: "Article 21",
        relevanceScore: 0.95,
        excerpt: "Protection of life and personal liberty",
      },
    ],
  },
  {
    content: "Based on Indian law, here's what you need to know:\n\n**Legal Principle**: The matter you're asking about falls under the jurisdiction of the Indian Penal Code.\n\n**Key Points**:\n- The relevant sections provide specific guidelines\n- Recent Supreme Court judgments have clarified the interpretation\n- You should consult with a qualified lawyer for case-specific advice\n\n**Next Steps**: Would you like me to explain the specific sections or recent case law?",
    sources: [
      {
        id: "2",
        title: "Indian Penal Code",
        type: "statute" as const,
        citation: "Section 302",
        relevanceScore: 0.88,
      },
    ],
  },
];

/**
 * Chat Service
 * Handles all chat-related API operations
 * Single Responsibility: Managing chat interactions with the backend
 */
export class ChatService {
  private demoSessionId = 'demo-session-1';
  private demoMessages: Message[] = [];
  private responseIndex = 0;

  /**
   * Send a message to the AI chatbot
   */
  async sendMessage(message: string, sessionId?: string): Promise<Message> {
    if (DEMO_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      this.demoMessages.push(userMessage);
      
      const demoResponse = DEMO_RESPONSES[this.responseIndex % DEMO_RESPONSES.length];
      this.responseIndex++;
      
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: demoResponse.content,
        timestamp: new Date(),
        metadata: {
          sources: demoResponse.sources,
          confidence: 0.92,
          processingTime: Math.floor(Math.random() * 1000) + 500,
        },
      };
      
      this.demoMessages.push(assistantMessage);
      return assistantMessage;
    }

    try {
      return await apiRequest<Message>({
        method: 'POST',
        url: API_CONFIG.endpoints.chat,
        data: {
          message,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Chat API error:', error);
      throw new Error('Failed to connect to the chat service. Please try again later.');
    }
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<Message[]> {
    if (DEMO_MODE) {
      return sessionId === this.demoSessionId ? this.demoMessages : [];
    }

    try {
      return await apiRequest<Message[]>({
        method: 'GET',
        url: `${API_CONFIG.endpoints.chat}/${sessionId}/messages`,
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(title?: string): Promise<ChatSession> {
    if (DEMO_MODE) {
      const session: ChatSession = {
        id: this.demoSessionId,
        title: title || 'Demo Legal Consultation',
        messages: this.demoMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return session;
    }

    try {
      return await apiRequest<ChatSession>({
        method: 'POST',
        url: API_CONFIG.endpoints.sessions,
        data: {
          title: title || 'New Legal Consultation',
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create a new session. Please try again.');
    }
  }

  /**
   * Get all chat sessions for the current user
   */
  async getSessions(): Promise<ChatSession[]> {
    if (DEMO_MODE) {
      return [
        {
          id: this.demoSessionId,
          title: 'Demo Constitutional Law Query',
          messages: this.demoMessages,
          createdAt: new Date(Date.now() - 86400000), // Yesterday
          updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          id: 'demo-session-2',
          title: 'Property Law Consultation',
          messages: [],
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          updatedAt: new Date(Date.now() - 172800000),
        },
      ];
    }

    try {
      return await apiRequest<ChatSession[]>({
        method: 'GET',
        url: API_CONFIG.endpoints.sessions,
      });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (DEMO_MODE) {
      // In demo mode, just log the action
      console.log('Demo mode: Would delete session', sessionId);
      return;
    }

    try {
      await apiRequest({
        method: 'DELETE',
        url: `${API_CONFIG.endpoints.sessions}/${sessionId}`,
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('Failed to delete the session. Please try again.');
    }
  }

  /**
   * Get legal sources referenced in a message
   */
  async getMessageSources(messageId: string): Promise<LegalSource[]> {
    if (DEMO_MODE) {
      return [];
    }

    try {
      return await apiRequest<LegalSource[]>({
        method: 'GET',
        url: `${API_CONFIG.endpoints.sources}/${messageId}`,
      });
    } catch (error) {
      console.error('Failed to load sources:', error);
      return [];
    }
  }

  /**
   * Stream chat response (for real-time typing effect)
   */
  async *streamMessage(
    message: string,
    sessionId?: string
  ): AsyncGenerator<string, void, unknown> {
    if (DEMO_MODE) {
      // Simulate streaming in demo mode
      const demoResponse = DEMO_RESPONSES[this.responseIndex % DEMO_RESPONSES.length];
      const words = demoResponse.content.split(' ');
      
      for (const word of words) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing delay
        yield word + ' ';
      }
      
      this.responseIndex++;
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              yield parsed.content;
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Fallback to demo mode
      yield* this.streamMessage(message, sessionId);
    }
  }
}

// Export singleton instance
export const chatService = new ChatService(); 