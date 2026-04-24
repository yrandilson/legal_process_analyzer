import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import { storagePut } from "./storage";
import { processLegalDocument, saveProcessedDocument } from "./services/documentProcessor";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    devLogin: publicProcedure
      .input(
        z
          .object({
            name: z.string().optional(),
            email: z.string().email().optional(),
          })
          .optional()
      )
      .mutation(async ({ ctx, input }) => {
        if (ENV.isProduction) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Dev login está desabilitado em produção.",
          });
        }

        const openId = "local-dev-user";
        const name = input?.name || "Advogado Local";
        const email = input?.email || "local@sentinela.dev";

        await db.upsertUser({
          openId,
          name,
          email,
          loginMethod: "local-dev",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          mode: "local-dev",
        } as const;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  processes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProcessesByUserId(ctx.user.id);
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getProcessByIdForUser(input.id, ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          processNumber: z.string(),
          clientName: z.string(),
          court: z.string().optional(),
          judge: z.string().optional(),
          plaintiff: z.string().optional(),
          defendant: z.string().optional(),
          subject: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createProcess({
          userId: ctx.user.id,
          ...input,
        });
        return result;
      }),
  }),

  documents: router({
    listByProcess: protectedProcedure
      .input(z.object({ processId: z.number() }))
      .query(async ({ ctx, input }) => {
        const process = await db.getProcessByIdForUser(input.processId, ctx.user.id);
        if (!process) return [];
        return db.getDocumentsByProcessId(input.processId);
      }),

    listMine: protectedProcedure.query(async ({ ctx }) => {
      return db.getDocumentsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getDocumentByIdForUser(input.id, ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          processId: z.number(),
          fileName: z.string(),
          fileKey: z.string(),
          fileUrl: z.string(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const process = await db.getProcessByIdForUser(input.processId, ctx.user.id);
        if (!process) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
        }

        const result = await db.createDocument({
          ...input,
          status: "uploaded",
        });
        return result;
      }),

    uploadAndProcess: protectedProcedure
      .input(
        z.object({
          processNumber: z.string().min(1),
          clientName: z.string().min(1),
          fileName: z.string().min(1),
          mimeType: z.string().default("application/pdf"),
          fileSize: z.number().optional(),
          fileBase64: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await db.findProcessByNumberForUser(ctx.user.id, input.processNumber);

        const process =
          existing ||
          (await db.createProcess({
            userId: ctx.user.id,
            processNumber: input.processNumber,
            clientName: input.clientName,
          }));

        if (!process) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar processo" });
        }

        const pdfBuffer = Buffer.from(input.fileBase64, "base64");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileKey = `legal/${ctx.user.id}/${process.id}/${Date.now()}-${safeName}`;

        const useRemoteStorage = ENV.isProduction;
        const fileUrl = useRemoteStorage
          ? (await storagePut(fileKey, pdfBuffer, input.mimeType || "application/pdf")).url
          : `local-dev://${fileKey}`;

        const document = await db.createDocument({
          processId: process.id,
          fileName: input.fileName,
          fileKey,
          fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          status: "processing",
        });

        if (!document) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar documento" });
        }

        try {
          const processed = await processLegalDocument(pdfBuffer);
          const result = await saveProcessedDocument(
            process.id,
            document.id,
            processed,
            processed.extractedText
          );

          const updatedDocument = await db.getDocumentById(document.id);

          return {
            process,
            document: updatedDocument,
            createdDeadlines: result.createdDeadlines,
          };
        } catch (error) {
          await db.updateDocumentById(document.id, {
            status: "failed",
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Falha ao processar documento",
          });
        }
      }),
  }),

  deadlines: router({
    listByProcess: protectedProcedure
      .input(z.object({ processId: z.number() }))
      .query(async ({ ctx, input }) => {
        const process = await db.getProcessByIdForUser(input.processId, ctx.user.id);
        if (!process) return [];
        return db.getDeadlinesByProcessId(input.processId);
      }),

    listMine: protectedProcedure.query(async ({ ctx }) => {
      return db.getDeadlinesByUserId(ctx.user.id);
    }),

    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getDeadlineByIdForUser(input.id, ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          processId: z.number(),
          type: z.string(),
          description: z.string(),
          originalDate: z.date(),
          calculatedDate: z.date(),
          businessDaysCount: z.number(),
          urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const process = await db.getProcessByIdForUser(input.processId, ctx.user.id);
        if (!process) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Processo não encontrado" });
        }

        return db.createDeadline({
          ...input,
          status: "pending",
          urgency: input.urgency || "medium",
        });
      }),

    exportIcs: protectedProcedure
      .input(
        z
          .object({
            processId: z.number().optional(),
          })
          .optional()
      )
      .mutation(async ({ ctx, input }) => {
        const deadlines = input?.processId
          ? await db.getDeadlinesByProcessId(input.processId)
          : await db.getDeadlinesByUserId(ctx.user.id);

        const userDeadlines = input?.processId
          ? await (async () => {
              const process = await db.getProcessByIdForUser(input.processId!, ctx.user.id);
              return process ? deadlines : [];
            })()
          : deadlines;

        const toIcsDate = (value: Date | string) => {
          const date = new Date(value);
          const yyyy = date.getUTCFullYear();
          const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(date.getUTCDate()).padStart(2, "0");
          const hh = String(date.getUTCHours()).padStart(2, "0");
          const mi = String(date.getUTCMinutes()).padStart(2, "0");
          const ss = String(date.getUTCSeconds()).padStart(2, "0");
          return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
        };

        const now = toIcsDate(new Date());
        const events = userDeadlines
          .map((deadline) => {
            const start = toIcsDate(deadline.calculatedDate);
            return [
              "BEGIN:VEVENT",
              `UID:deadline-${deadline.id}@sentinela`,
              `DTSTAMP:${now}`,
              `DTSTART:${start}`,
              `SUMMARY:${deadline.type}`,
              `DESCRIPTION:${(deadline.description || "").replace(/\n/g, " ")}`,
              "END:VEVENT",
            ].join("\r\n");
          })
          .join("\r\n");

        const content = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Sentinela de Prazos//PT-BR//",
          events,
          "END:VCALENDAR",
        ].join("\r\n");

        return {
          fileName: "prazos.ics",
          content,
          count: userDeadlines.length,
        };
      }),
  }),

  notifications: router({
    listByUser: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationsByUserId(ctx.user.id);
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getNotificationById(input.id);
    }),

    create: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          deadlineId: z.number(),
          type: z.enum(["email", "in_app", "both"]).optional(),
          daysBeforeDeadline: z.number(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.createNotification({
          ...input,
          type: input.type || "both",
          status: "pending",
        });
      }),
  }),

  ai: router({
    chat: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [processes, deadlines, documents] = await Promise.all([
          db.getProcessesByUserId(ctx.user.id),
          db.getDeadlinesByUserId(ctx.user.id),
          db.getDocumentsByUserId(ctx.user.id),
        ]);

        const context = {
          totalProcesses: processes.length,
          criticalDeadlines: deadlines
            .filter(d => d.urgency === "critical")
            .map(d => ({
              id: d.id,
              type: d.type,
              date: d.calculatedDate,
              status: d.status,
            }))
            .slice(0, 10),
          recentDocuments: documents.slice(0, 10).map(d => ({
            id: d.id,
            fileName: d.fileName,
            status: d.status,
            processedAt: d.processedAt,
          })),
        };

        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente jurídico para advogados brasileiros. Responda em português claro, direto e com foco em ações práticas sobre prazos e processos.",
            },
            {
              role: "system",
              content: `Contexto do usuário: ${JSON.stringify(context)}`,
            },
            {
              role: "user",
              content: input.message,
            },
          ],
        });

        const answer = result.choices[0]?.message.content;

        if (typeof answer === "string" && answer.trim().length > 0) {
          return { answer };
        }

        return {
          answer:
            "Não consegui gerar uma resposta útil agora. Tente reformular sua pergunta sobre processos, prazos ou documentos.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
