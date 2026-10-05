/**
 * GDG Ranchi DevFest 2026 - Team Utilities
 */

export class TeamUtils {
  /**
   * Generates a 6-character random alphanumeric joining code (e.g. DEVX26).
   */
  public static GENERATE_TEAM_CODE(prefix = "DF"): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${code}`;
  }
}
