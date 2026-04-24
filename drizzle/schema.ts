import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Legal Process Tables
export const processes = mysqlTable("processes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  processNumber: varchar("processNumber", { length: 50 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  court: varchar("court", { length: 255 }),
  judge: varchar("judge", { length: 255 }),
  plaintiff: varchar("plaintiff", { length: 255 }),
  defendant: varchar("defendant", { length: 255 }),
  subject: text("subject"),
  status: mysqlEnum("status", ["active", "archived", "concluded"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Process = typeof processes.$inferSelect;
export type InsertProcess = typeof processes.$inferInsert;

export const deadlines = mysqlTable("deadlines", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => processes.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(), // e.g., "contestação", "recurso", "manifestação"
  description: text("description").notNull(),
  originalDate: timestamp("originalDate").notNull(),
  calculatedDate: timestamp("calculatedDate").notNull(),
  businessDaysCount: int("businessDaysCount").notNull(),
  status: mysqlEnum("status", ["pending", "notified", "completed", "overdue"]).default("pending"),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).default("medium"),
  notificationSent: int("notificationSent").default(0), // 0: not sent, 1: sent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = typeof deadlines.$inferInsert;

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  processId: int("processId").notNull().references(() => processes.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 50 }),
  extractedText: text("extractedText"),
  summary: text("summary"),
  entities: text("entities"), // JSON: {processNumber, parties, judge, dates}
  processedAt: timestamp("processedAt"),
  status: mysqlEnum("status", ["uploaded", "processing", "processed", "failed"]).default("uploaded"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  deadlineId: int("deadlineId").notNull().references(() => deadlines.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["email", "in_app", "both"]).default("both"),
  daysBeforeDeadline: int("daysBeforeDeadline").notNull(), // 3, 1, 0 (today)
  message: text("message"),
  emailSent: int("emailSent").default(0),
  inAppSent: int("inAppSent").default(0),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;