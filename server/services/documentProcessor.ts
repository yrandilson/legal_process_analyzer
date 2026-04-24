import { invokeLLM } from "../_core/llm";
import { extractTextFromPDF, normalizeExtractedText } from "../utils/pdfExtractor";
import { LEGAL_ANALYSIS_PROMPTS, formatPrompt } from "../utils/aiPrompts";
import { addBusinessDays, getUrgencyLevel } from "../utils/businessDays";
import * as db from "../db";

export interface ProcessedDocument {
  extractedText: string;
  entities: {
    processNumber: string | null;
    plaintiff: string | null;
    defendant: string | null;
    judge: string | null;
    court: string | null;
    publicationDate: string | null;
    movementType: string | null;
    confidence: number | null;
  };
  summary: string;
  deadlines: Array<{
    type: string;
    description: string;
    businessDays: number;
    startDate: string;
  }>;
}

/**
 * Processa um documento PDF e extrai informações jurídicas
 */
export async function processLegalDocument(pdfBuffer: Buffer): Promise<ProcessedDocument> {
  // Extrai texto do PDF
  const extractedPDF = await extractTextFromPDF(pdfBuffer);
  const normalizedText = normalizeExtractedText(extractedPDF.text);

  // Extrai entidades jurídicas
  const entitiesPrompt = formatPrompt(LEGAL_ANALYSIS_PROMPTS.extractEntities, {
    document_text: normalizedText,
  });

  const entitiesResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Você é um especialista em análise de documentos jurídicos brasileiros.",
      },
      {
        role: "user",
        content: entitiesPrompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "legal_entities",
        strict: true,
        schema: {
          type: "object",
          properties: {
            processNumber: { type: ["string", "null"] },
            plaintiff: { type: ["string", "null"] },
            defendant: { type: ["string", "null"] },
            judge: { type: ["string", "null"] },
            court: { type: ["string", "null"] },
            publicationDate: { type: ["string", "null"] },
            movementType: { type: ["string", "null"] },
            confidence: { type: ["number", "null"] },
          },
          required: [
            "processNumber",
            "plaintiff",
            "defendant",
            "judge",
            "court",
            "publicationDate",
            "movementType",
            "confidence",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  let entities = {
    processNumber: null,
    plaintiff: null,
    defendant: null,
    judge: null,
    court: null,
    publicationDate: null,
    movementType: null,
    confidence: null,
  };

  try {
    const content = entitiesResponse.choices[0]?.message.content;
    if (content && typeof content === "string") {
      entities = JSON.parse(content);
    }
  } catch (error) {
    console.error("Erro ao parsear entidades:", error);
  }

  // Identifica prazos
  const deadlinesPrompt = formatPrompt(LEGAL_ANALYSIS_PROMPTS.identifyDeadlines, {
    document_text: normalizedText,
  });

  const deadlinesResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Você é um especialista em prazos processuais brasileiros.",
      },
      {
        role: "user",
        content: deadlinesPrompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "deadlines_list",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              description: { type: "string" },
              businessDays: { type: "number" },
              startDate: { type: "string" },
            },
            required: ["type", "description", "businessDays", "startDate"],
            additionalProperties: false,
          },
        },
      },
    },
  });

  let deadlines: Array<{
    type: string;
    description: string;
    businessDays: number;
    startDate: string;
  }> = [];

  try {
    const content = deadlinesResponse.choices[0]?.message.content;
    if (content && typeof content === "string") {
      deadlines = JSON.parse(content);
    }
  } catch (error) {
    console.error("Erro ao parsear prazos:", error);
  }

  // Gera resumo para cliente
  const summaryPrompt = formatPrompt(LEGAL_ANALYSIS_PROMPTS.generateSummary, {
    document_text: normalizedText,
  });

  const summaryResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um advogado experiente que explica processos em linguagem simples para clientes leigos.",
      },
      {
        role: "user",
        content: summaryPrompt,
      },
    ],
  });

  const summaryContent = summaryResponse.choices[0]?.message.content;
  const summary =
    typeof summaryContent === "string" ? summaryContent : "Resumo não disponível";

  return {
    extractedText: normalizedText,
    entities,
    summary,
    deadlines,
  };
}

/**
 * Salva os dados processados no banco de dados
 */
export async function saveProcessedDocument(
  processId: number,
  documentId: number,
  processed: ProcessedDocument,
  extractedText: string
) {
  await db.updateDocumentById(documentId, {
    summary: processed.summary,
    entities: JSON.stringify(processed.entities),
    extractedText,
    processedAt: new Date(),
    status: "processed",
  });

  let createdDeadlines = 0;

  // Cria prazos no banco de dados
  for (const deadline of processed.deadlines) {
    const startDate = new Date(deadline.startDate);
    const calculatedDate = addBusinessDays(startDate, deadline.businessDays);
    const urgency = getUrgencyLevel(deadline.businessDays);

    await db.createDeadline({
      processId,
      type: deadline.type,
      description: deadline.description,
      originalDate: startDate,
      calculatedDate,
      businessDaysCount: deadline.businessDays,
      urgency,
      status: "pending",
    });

    createdDeadlines++;
  }

  return {
    createdDeadlines,
  };
}
