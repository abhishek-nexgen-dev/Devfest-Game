import { apiV1Router } from "../api/v1";

/**
 * Main API v1 Router mount point.
 * Directs traffic to domain-specific modules (Auth, Participants, Teams, Games, Leaderboard, etc.)
 */
const route = apiV1Router;

export { route, apiV1Router };
export default route;
