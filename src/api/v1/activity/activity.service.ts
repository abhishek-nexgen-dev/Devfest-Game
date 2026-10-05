import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { IActivityLogItem } from "./activity.types";

/**
 * GDG Ranchi DevFest 2026 - Activity Logging Service
 * Cloud Firestore document-driven security audit trail and system events.
 */
export class ActivityService {
  public static async LOG_ACTION(
    action: string,
    userId?: string,
    details?: string,
    ipAddress?: string,
  ): Promise<void> {
    const logId = "act-" + Date.now();
    const nowIso = new Date().toISOString();

    const logDoc = {
      id: logId,
      userId: userId || null,
      action,
      details: details || null,
      ipAddress: ipAddress || null,
      createdAt: nowIso,
    };

    await dataStore.saveDocument("activity_logs", dataStore.activityLogs, logDoc);
    logger.info(`Activity logged: ${action} by user ${userId || "System"}`);
  }

  public async LIST_LOGS(userId?: string, limit = 100): Promise<IActivityLogItem[]> {
    const all = await dataStore.activityLogs.getAll();
    const filtered = userId ? all.filter((l) => l.userId === userId) : all;

    return filtered.slice(0, limit).map((l) => ({
      id: l.id,
      userId: l.userId,
      action: l.action,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: new Date(l.createdAt),
    }));
  }
}
