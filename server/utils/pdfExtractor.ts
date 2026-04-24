type PdfParseCtor = new (options: { data: Buffer | Uint8Array }) => {
  getText: () => Promise<{ text: string; total: number }>;
  destroy: () => Promise<void>;
};

let cachedPdfParseCtor: PdfParseCtor | null = null;

async function getPdfParseCtor(): Promise<PdfParseCtor> {
  if (cachedPdfParseCtor) {
    return cachedPdfParseCtor;
  }

  const module = await import("pdf-parse");
  const candidate = (module as any).PDFParse;

  if (typeof candidate !== "function") {
    throw new Error("pdf-parse não exporta PDFParse");
  }

  cachedPdfParseCtor = candidate as PdfParseCtor;
  return cachedPdfParseCtor;
}

export interface ExtractedPDFData {
  text: string;
  pageCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Extrai texto de um arquivo PDF
 * @param pdfBuffer - Buffer do arquivo PDF
 * @returns Texto extraído e metadados
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<ExtractedPDFData> {
  let parser: { getText: () => Promise<{ text: string; total: number }>; destroy: () => Promise<void> } | null = null;

  try {
    const PDFParse = await getPdfParseCtor();
    parser = new PDFParse({ data: pdfBuffer });
    const data = await parser.getText();

    return {
      text: data.text,
      pageCount: data.total,
    };
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    throw new Error(`Falha ao processar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  } finally {
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
  }
}

/**
 * Limpa e normaliza o texto extraído do PDF
 */
export function normalizeExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Remove múltiplos espaços
    .replace(/\n+/g, " ") // Remove quebras de linha
    .trim();
}
