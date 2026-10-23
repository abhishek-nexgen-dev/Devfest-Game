import { Request, Response } from "express";
import { participantService } from "./Participants.Service";
import { ParticipantConstants } from "./participant.constants";
import { createParticipant_Type } from "./Participants.validation";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import SendResponse from "../../../utils/SendResponse";

export class ParticipantController {
  /**
   * Create a new Participant (Public — anyone can create)
   * POST /api/v1/participants
   */
  async createParticipant(req: Request, res: Response): Promise<void> {
    // If client submits array or object containing array to standard creation endpoint, handle gracefully
    if (
      Array.isArray(req.body) ||
      (req.body &&
        typeof req.body === "object" &&
        (Array.isArray(req.body.participants) ||
          Array.isArray(req.body.data) ||
          Array.isArray(req.body.items)))
    ) {
      return this.createBulkParticipants(req, res);
    }

    try {
      const result = await participantService.createParticipant(req.body as createParticipant_Type);

      SendResponse.SuccessResponse(res, result, ParticipantConstants.MESSAGES.PARTICIPANT_CREATED);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to create participant";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Create Participants in Bulk (Public)
   * POST /api/v1/participants/bulk
   * POST /api/v1/participant/bulk
   */
  async createBulkParticipants(req: Request, res: Response): Promise<void> {
    try {
      const result = await participantService.createBulkParticipants(req.body);

      SendResponse.SuccessResponse(
        res,
        result,
        ParticipantConstants.MESSAGES.PARTICIPANTS_BULK_CREATED,
      );
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to create participants in bulk";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Get all Participants (Supports pagination, search, track, cert filter, and sorting)
   * GET /api/v1/participants
   */
  async getAllParticipants(req: Request, res: Response): Promise<void> {
    try {
      const result = await participantService.getAllParticipants(req.query);

      SendResponse.SuccessResponse(res, result, ParticipantConstants.MESSAGES.PARTICIPANTS_LISTED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : "Failed to fetch participants",
      );
    }
  }

  /**
   * Get a Participant by Ticket ID
   * GET /api/v1/participants/:ticketId
   */
  async getParticipantByTicketId(req: Request, res: Response): Promise<void> {
    try {
      const ticketId = req.params.ticketId as string;
      if (!ticketId) {
        throw new Error(ParticipantConstants.MESSAGES.TICKET_ID_REQUIRED);
      }

      const result = await participantService.getParticipantByTicketId(ticketId);

      SendResponse.SuccessResponse(res, result, ParticipantConstants.MESSAGES.PROFILE_FETCHED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error
          ? error.message
          : ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND,
      );
    }
  }

  /**
   * Public Join Game
   * Canonical endpoint: POST /api/v1/participants/join-game
   * Payload: { email, ticket_id, game_id }
   */
  async joinGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await participantService.joinGame(req.body);

      SendResponse.SuccessResponse(res, result.participant, result.message);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to join game";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Update a Participant
   * Supports:
   * - PUT   /api/v1/participants/:ticketId
   * - PATCH /api/v1/participants/:ticketId
   */
  async updateParticipant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticketId = (req.params?.ticketId as string) || (req.body?.ticket_id as string);

      const result = await participantService.updateParticipant(ticketId, req.body, req.user);

      SendResponse.SuccessResponse(res, result.participant, result.message);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to update participant";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  async updateGameScore(req: Request, res: Response): Promise<void> {
    try {
      const ticketId =
        (req.body?.ticket_id as string) ||
        (req.body?.ticketId as string) ||
        (req.query?.ticket_id as string) ||
        (req.query?.ticketId as string);

      const gameId =
        (req.body?.game_id !== undefined ? String(req.body.game_id) : "") ||
        (req.body?.gameId !== undefined ? String(req.body.gameId) : "") ||
        (req.query?.game_id as string) ||
        (req.query?.gameId as string);

      const score = req.body?.score !== undefined ? req.body.score : req.query?.score;
      const isCompleted =
        req.body?.isCompleted !== undefined
          ? req.body.isCompleted
          : req.body?.is_completed !== undefined
            ? req.body.is_completed
            : req.query?.isCompleted !== undefined
              ? req.query.isCompleted === "true"
              : false;

      const updatedParticipant = await participantService.updateParticipant_Game(
        ticketId,
        gameId,
        Number(score),
        Boolean(isCompleted),
      );

      SendResponse.SuccessResponse(
        res,
        updatedParticipant,
        "Participant game score updated successfully.",
      );
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to update game score";
      SendResponse.ErrorResponse(res, error, message);
    }
  }
}

export const participantController = new ParticipantController();
export default participantController;
