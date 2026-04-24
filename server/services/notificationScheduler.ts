import * as db from "../db";
import { getBusinessDaysUntil } from "../utils/businessDays";

const REMINDER_DAYS = new Set([3, 1, 0]);
let schemaChecked = false;

async function ensureSchedulerSchema() {
  if (schemaChecked) return;
  await db.ensureNotificationsSchemaCompatibility();
  schemaChecked = true;
}

function buildReminderMessage(type: string, targetDate: Date, daysBeforeDeadline: number): string {
  const date = targetDate.toLocaleDateString("pt-BR");

  if (daysBeforeDeadline === 0) {
    return `Prazo vence hoje (${date}): ${type}.`;
  }

  if (daysBeforeDeadline === 1) {
    return `Prazo vence em 1 dia útil (${date}): ${type}.`;
  }

  return `Prazo vence em ${daysBeforeDeadline} dias úteis (${date}): ${type}.`;
}

export async function scheduleDeadlineNotifications(): Promise<number> {
  const users = await db.getAllUsers();
  let created = 0;

  for (const user of users) {
    const deadlines = await db.getDeadlinesByUserId(user.id);

    for (const deadline of deadlines) {
      if (deadline.status !== "pending") continue;

      const businessDaysUntil = getBusinessDaysUntil(new Date(deadline.calculatedDate));
      if (!REMINDER_DAYS.has(businessDaysUntil)) continue;

      const alreadyExists = await db.findNotificationByDeadlineAndDays(
        user.id,
        deadline.id,
        businessDaysUntil
      );

      if (alreadyExists) continue;

      await db.createNotification({
        userId: user.id,
        deadlineId: deadline.id,
        type: "in_app",
        daysBeforeDeadline: businessDaysUntil,
        message: buildReminderMessage(deadline.type, new Date(deadline.calculatedDate), businessDaysUntil),
        status: "pending",
      });
      created += 1;
    }
  }

  return created;
}

export async function dispatchPendingNotifications(): Promise<number> {
  const pending = await db.getPendingNotifications();
  let dispatched = 0;

  for (const notification of pending) {
    await db.updateNotificationById(notification.id, {
      inAppSent: 1,
      status: "sent",
      sentAt: new Date(),
    });
    dispatched += 1;
  }

  return dispatched;
}

export async function runNotificationCycle(): Promise<{ created: number; dispatched: number }> {
  await ensureSchedulerSchema();
  const created = await scheduleDeadlineNotifications();
  const dispatched = await dispatchPendingNotifications();
  return { created, dispatched };
}
