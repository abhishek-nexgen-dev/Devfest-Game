/**
 * GDG Ranchi DevFest 2026 - Participant Utilities
 */

export class ParticipantUtils {
  /**
   * Masks mobile numbers for privacy in public leaderboards and cards (e.g. +91 98****3210).
   */
  public static MASK_MOBILE(mobile: string): string {
    const cleaned = mobile.trim();
    if (cleaned.length < 8) return "********";
    const start = cleaned.substring(0, 4);
    const end = cleaned.substring(cleaned.length - 3);
    return `${start}****${end}`;
  }

  /**
   * Formats sequential number into standard GDGR format (e.g. GDGR-0042).
   */
  public static FORMAT_PARTICIPANT_CODE(sequence: number, prefix = "GDGR"): string {
    return `${prefix}-${sequence.toString().padStart(4, "0")}`;
  }

  /**
   * Calculates participation completion percentage.
   */
  public static CALCULATE_COMPLETION_RATE(completed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((completed / total) * 100));
  }
}
