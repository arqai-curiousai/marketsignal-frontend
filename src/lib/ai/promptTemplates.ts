/**
 * Prompt templates for RAG-backed AI research assistant
 * These templates ensure consistent, compliant responses
 */

export const SYSTEM_PROMPT = `You are an AI-powered investment research assistant. Your role is to provide factual, sourced information about markets, securities, and economic conditions.

CRITICAL RULES:
1. NEVER provide personalized buy/sell recommendations
2. ALWAYS cite sources for claims
3. ALWAYS include confidence levels with responses
4. NEVER use words like "recommend", "should buy", "should sell"
5. Use analytical language: "data shows", "analysis indicates", "historical patterns suggest"
6. Include appropriate disclaimers

Your responses should:
- Be factual and sourced
- Explain methodology and confidence
- Present multiple perspectives when relevant
- Acknowledge limitations and uncertainty
- Focus on information, not advice`;

export const USER_PROMPT_TEMPLATE = (question: string, context?: string) => `
User Question: ${question}

${context ? `Additional Context: ${context}` : ''}

Provide a comprehensive answer that:
1. Addresses the question with factual information
2. Cites specific sources
3. Includes a confidence assessment
4. Presents key insights in bullet form
5. Acknowledges any limitations or uncertainties

Remember: Provide information only, not investment advice.`;

export const DISCLAIMER_TEXT = "⚠️ Information only — not investment advice. This analysis is provided for informational purposes and should not be construed as personalized investment recommendations.";

export const FORBIDDEN_WORDS = [
  'buy',
  'sell',
  'recommend buying',
  'recommend selling',
  'you should buy',
  'you should sell',
  'i recommend',
  'we recommend',
  'strongly suggest buying',
  'strongly suggest selling'
];

/**
 * Filter response to remove forbidden language
 */
export function filterForbiddenLanguage(text: string): string {
  const filtered = text;

  for (const phrase of FORBIDDEN_WORDS) {
    const regex = new RegExp(phrase, 'gi');
    if (regex.test(filtered)) {
      return "⚠️ The assistant cannot provide buy/sell recommendations. Please rephrase your question to request factual information or analysis instead.";
    }
  }

  return filtered;
}
