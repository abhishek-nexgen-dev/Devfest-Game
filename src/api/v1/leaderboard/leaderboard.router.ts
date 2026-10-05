import { Router } from "express";
import { LeaderboardConstants } from "./leaderboard.constants";
import { LeaderboardController } from "./leaderboard.controller";

/**
 * GDG Ranchi DevFest 2026 - Leaderboard Router
 */
export class LeaderboardRouter {
  private readonly router: Router;
  private readonly controller: LeaderboardController;

  constructor(controller: LeaderboardController = new LeaderboardController()) {
    this.router = Router();
    this.controller = controller;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get(LeaderboardConstants.ROUTES.INDIVIDUAL, this.controller.GET_INDIVIDUAL);
    this.router.get(LeaderboardConstants.ROUTES.TEAMS, this.controller.GET_TEAMS);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const leaderboardRouter = new LeaderboardRouter().getRouter();
export default leaderboardRouter;
