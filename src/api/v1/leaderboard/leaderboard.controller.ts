import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.util";
import { LeaderboardConstants } from "./leaderboard.constants";
import { LeaderboardService } from "./leaderboard.service";

/**
 * GDG Ranchi DevFest 2026 - Leaderboard Controller
 */
export class LeaderboardController {
  private readonly leaderboardService: LeaderboardService;

  constructor(leaderboardService: LeaderboardService = new LeaderboardService()) {
    this.leaderboardService = leaderboardService;
  }

  public GET_INDIVIDUAL = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 50;
      const data = await this.leaderboardService.GET_INDIVIDUAL_LEADERBOARD(limit);
      sendSuccess(res, data, LeaderboardConstants.MESSAGES.INDIVIDUAL_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_TEAMS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number(req.query.limit) || 50;
      const data = await this.leaderboardService.GET_TEAM_LEADERBOARD(limit);
      sendSuccess(res, data, LeaderboardConstants.MESSAGES.TEAMS_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };
}
