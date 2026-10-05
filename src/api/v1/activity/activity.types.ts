/**
 * GDG Ranchi DevFest 2026 - Activity Log Types
 */

export interface IActivityLogItem {
  id: string;
  userId?: string | null;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}
