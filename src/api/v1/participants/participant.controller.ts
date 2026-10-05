import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";
import { ParticipantConstants } from "./participant.constants";
import { ParticipantService } from "./participant.service";

/**
 * GDG Ranchi DevFest 2026 - Participant Controller
 */
export class ParticipantController {
  private readonly participantService: ParticipantService;

  constructor(participantService: ParticipantService = new ParticipantService()) {
    this.participantService = participantService;
  }

  /**
   * GET /api/v1/participants/me
   */
  public GET_MY_PROFILE = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(ParticipantConstants.MESSAGES.UNAUTHORIZED_ACCESS);
      }

      const participant = await this.participantService.FIND_PARTICIPANT_BY_USER_ID(
        req.user.userId,
      );
      sendSuccess(res, participant, ParticipantConstants.MESSAGES.PROFILE_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/participants/me
   */
  public UPDATE_MY_PROFILE = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(ParticipantConstants.MESSAGES.UNAUTHORIZED_ACCESS);
      }

      const updated = await this.participantService.UPDATE_PARTICIPANT_PROFILE(
        req.user.userId,
        req.body,
      );
      sendSuccess(res, updated, ParticipantConstants.MESSAGES.PROFILE_UPDATED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/participants/me/games
   */
  public GET_MY_GAMES = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(ParticipantConstants.MESSAGES.UNAUTHORIZED_ACCESS);
      }

      const games = await this.participantService.GET_PARTICIPANT_GAMES(req.user.userId);
      sendSuccess(res, games, ParticipantConstants.MESSAGES.GAMES_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/participants/me/scores
   */
  public GET_MY_SCORES = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(ParticipantConstants.MESSAGES.UNAUTHORIZED_ACCESS);
      }

      const scores = await this.participantService.GET_PARTICIPANT_SCORES(req.user.userId);
      sendSuccess(res, scores, ParticipantConstants.MESSAGES.SCORES_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/participants/me/team
   */
  public GET_MY_TEAM = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(ParticipantConstants.MESSAGES.UNAUTHORIZED_ACCESS);
      }

      const team = await this.participantService.GET_PARTICIPANT_TEAM(req.user.userId);
      sendSuccess(
        res,
        team,
        team ? ParticipantConstants.MESSAGES.TEAM_FETCHED : ParticipantConstants.MESSAGES.NO_TEAM,
        200,
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/participants
   * List participants (Super Admin only).
   */
  public LIST_ALL = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.participantService.LIST_PARTICIPANTS(req.query);
      sendSuccess(
        res,
        result.participants,
        ParticipantConstants.MESSAGES.PARTICIPANTS_LISTED,
        200,
        result.meta,
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/participants/:id
   */
  public GET_BY_ID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const participant = await this.participantService.FIND_PARTICIPANT_BY_ID(req.params.id);
      sendSuccess(res, participant, ParticipantConstants.MESSAGES.PROFILE_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/participants/:id/status
   */
  public UPDATE_STATUS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response = await this.participantService.TOGGLE_PARTICIPANT_STATUS(
        req.params.id,
        req.body.status,
      );
      sendSuccess(res, response, ParticipantConstants.MESSAGES.STATUS_UPDATED, 200);
    } catch (error) {
      next(error);
    }
  };
}
