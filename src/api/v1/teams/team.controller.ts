import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";
import { TeamConstants } from "./team.constants";
import { TeamService } from "./team.service";

/**
 * GDG Ranchi DevFest 2026 - Team Controller
 */
export class TeamController {
  private readonly teamService: TeamService;

  constructor(teamService: TeamService = new TeamService()) {
    this.teamService = teamService;
  }

  public CREATE = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const participantId = req.user?.participantId || req.user?.userId;
      if (!participantId) {
        throw new UnauthorizedError(TeamConstants.MESSAGES.NOT_TEAM_LEADER);
      }

      const team = await this.teamService.CREATE_TEAM(participantId, req.body);
      sendSuccess(res, team, TeamConstants.MESSAGES.TEAM_CREATED, 201);
    } catch (error) {
      next(error);
    }
  };

  public JOIN = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const participantId = req.user?.participantId || req.user?.userId;
      if (!participantId) {
        throw new UnauthorizedError(TeamConstants.MESSAGES.NOT_TEAM_LEADER);
      }

      const team = await this.teamService.JOIN_TEAM(participantId, req.body);
      sendSuccess(res, team, TeamConstants.MESSAGES.JOIN_SUCCESS, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_DETAILS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const team = await this.teamService.GET_TEAM_DETAILS(req.params.id);
      sendSuccess(res, team, TeamConstants.MESSAGES.TEAM_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  public LIST = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teams = await this.teamService.LIST_TEAMS();
      sendSuccess(res, teams, TeamConstants.MESSAGES.TEAMS_LISTED, 200);
    } catch (error) {
      next(error);
    }
  };
}
