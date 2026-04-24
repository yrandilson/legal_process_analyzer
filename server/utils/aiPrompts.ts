/**
 * Prompts otimizados para análise de documentos jurídicos
 */

export const LEGAL_ANALYSIS_PROMPTS = {
  /**
   * Extrai entidades jurídicas (NER - Named Entity Recognition)
   */
  extractEntities: `Você é um especialista em análise de documentos jurídicos brasileiros.

Analise o texto abaixo e extraia APENAS as seguintes informações em formato JSON:
- processNumber: número do processo (ex: 0000000-00.0000.0.00.0000)
- plaintiff: nome da parte autora
- defendant: nome da parte ré
- judge: nome do juiz
- court: tribunal/vara
- publicationDate: data da publicação (formato YYYY-MM-DD)
- movementType: tipo de movimentação (ex: sentença, despacho, intimação)
- confidence: nível de confiança da extração de 0 a 100

Se alguma informação não estiver presente, use null.

Responda APENAS com JSON válido, sem explicações adicionais.

Texto do documento:
{document_text}`,

  /**
   * Identifica prazos processuais
   */
  identifyDeadlines: `Você é um especialista em prazos processuais brasileiros.

Analise o texto abaixo e identifique TODOS os prazos mencionados. Para cada prazo encontrado, extraia:
- type: tipo de prazo (ex: "contestação", "recurso", "manifestação", "interposição de agravo")
- description: descrição exata do prazo conforme o documento
- businessDays: número de dias úteis (ex: 15, 30, 5)
- startDate: data inicial do prazo (formato YYYY-MM-DD)

Regras importantes:
- Sempre converta prazos em dias úteis (considere que "dias" no CPC significa dias úteis)
- Prazos começam no dia SEGUINTE à intimação/publicação
- Identifique TODOS os prazos, mesmo que implícitos
- Se não houver data explícita, use a data de publicação como referência

Responda com um array JSON de prazos. Se nenhum prazo for encontrado, retorne [].

Texto do documento:
{document_text}`,

  /**
   * Gera resumo em linguagem simples para cliente
   */
  generateSummary: `Você é um advogado experiente que explica processos em linguagem simples para clientes leigos.

Leia o texto jurídico abaixo e crie um resumo de 3-4 linhas que:
1. Explique o que aconteceu no processo em linguagem clara e acessível
2. Destaque as decisões ou movimentações principais
3. Indique se há ações necessárias do cliente
4. Evite jargão jurídico ou use termos simples

Formato: Texto corrido, sem numeração ou bullet points.

Texto do documento:
{document_text}

Resumo para o cliente:`,

  /**
   * Valida e refina informações extraídas
   */
  validateExtraction: `Você é um especialista em validação de dados jurídicos.

Analise as informações extraídas abaixo e verifique se estão corretas e completas:

Informações extraídas:
{extracted_data}

Texto original:
{document_text}

Responda com um JSON contendo:
- isValid: boolean (true se os dados parecem corretos)
- corrections: array de correções sugeridas
- missingInfo: array de informações que não foram encontradas
- confidence: número de 0-100 indicando confiança na extração`,
};

export function formatPrompt(template: string, variables: Record<string, string>): string {
  let prompt = template;
  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(`{${key}}`, value);
  });
  return prompt;
}
