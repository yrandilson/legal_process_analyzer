import { drizzle } from "drizzle-orm/mysql2";
import { and, desc, eq, sql } from "drizzle-orm";
import { InsertUser, users, processes, InsertProcess, Process, documents, InsertDocument, Document, deadlines, InsertDeadline, Deadline, notifications, InsertNotification, Notification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function ensureNotificationsSchemaCompatibility(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const addColumnIfMissing = async (columnSql: string) => {
    try {
      await db.execute(sql.raw(`ALTER TABLE notifications ADD COLUMN ${columnSql}`));
    } catch (error: any) {
      if (error?.cause?.code === "ER_DUP_FIELDNAME") {
        return;
      }
      throw error;
    }
  };

  await addColumnIfMissing("emailSent int DEFAULT 0");
  await addColumnIfMissing("inAppSent int DEFAULT 0");
}

// Process queries
export async function createProcess(data: InsertProcess): Promise<Process | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(processes).values(data);
  return getProcessById(result[0].insertId);
}

export async function getProcessById(id: number): Promise<Process | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(processes).where(eq(processes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProcessByIdForUser(id: number, userId: number): Promise<Process | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(processes)
    .where(and(eq(processes.id, id), eq(processes.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProcessesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(processes).where(eq(processes.userId, userId));
}

export async function findProcessByNumberForUser(userId: number, processNumber: string): Promise<Process | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(processes)
    .where(and(eq(processes.userId, userId), eq(processes.processNumber, processNumber)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// Document queries
export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(documents).values(data);
  return getDocumentById(result[0].insertId);
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDocumentByIdForUser(id: number, userId: number): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ document: documents })
    .from(documents)
    .innerJoin(processes, eq(documents.processId, processes.id))
    .where(and(eq(documents.id, id), eq(processes.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0].document : null;
}

export async function getDocumentsByProcessId(processId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.processId, processId));
}

export async function getDocumentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ document: documents })
    .from(documents)
    .innerJoin(processes, eq(documents.processId, processes.id))
    .where(eq(processes.userId, userId))
    .orderBy(desc(documents.createdAt));
  return result.map(row => row.document);
}

export async function updateDocumentById(
  id: number,
  data: Partial<InsertDocument>
): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(documents).set(data).where(eq(documents.id, id));
  return getDocumentById(id);
}

// Deadline queries
export async function createDeadline(data: InsertDeadline) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deadlines).values(data);
  return getDeadlineById(result[0].insertId);
}

export async function getDeadlineById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deadlines).where(eq(deadlines.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDeadlineByIdForUser(id: number, userId: number): Promise<Deadline | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ deadline: deadlines })
    .from(deadlines)
    .innerJoin(processes, eq(deadlines.processId, processes.id))
    .where(and(eq(deadlines.id, id), eq(processes.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0].deadline : null;
}

export async function getDeadlinesByProcessId(processId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deadlines).where(eq(deadlines.processId, processId));
}

export async function getDeadlinesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ deadline: deadlines })
    .from(deadlines)
    .innerJoin(processes, eq(deadlines.processId, processes.id))
    .where(eq(processes.userId, userId))
    .orderBy(deadlines.calculatedDate);
  return result.map(row => row.deadline);
}

// Notification queries
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  return getNotificationById(result[0].insertId);
}

export async function getNotificationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId));
}

export async function findNotificationByDeadlineAndDays(
  userId: number,
  deadlineId: number,
  daysBeforeDeadline: number
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.deadlineId, deadlineId),
        eq(notifications.daysBeforeDeadline, daysBeforeDeadline)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.status, "pending"));
}

export async function updateNotificationById(
  id: number,
  data: Partial<InsertNotification>
): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(notifications).set(data).where(eq(notifications.id, id));
  return getNotificationById(id);
}
