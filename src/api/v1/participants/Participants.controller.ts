import { Request, Response } from "express";
import { participantService } from "./Participants.Service";
import { ParticipantConstants } from "./participant.constants";
import { createParticipant_Type, updateParticipant_Type } from "./Participants.validation";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import SendResponse from "../../../utils/SendResponse";

export class ParticipantController {
  /**
   * Create a new Participant (Public — anyone can create)
   * POST /api/v1/participants
   */
  async createParticipant(req: Request, res: Response): Promise<void> {
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
   * Get all Participants
   * GET /api/v1/participants
   */
  async getAllParticipants(_req: Request, res: Response): Promise<void> {
    try {
      const result = await participantService.getAllParticipants();

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
   * Update a Participant by Ticket ID (SUPER_ADMIN & ADMIN only)
   * PUT / PATCH /api/v1/participants/:ticketId
   */
  async updateParticipant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticketId = req.params.ticketId as string;
      if (!ticketId) {
        throw new Error(ParticipantConstants.MESSAGES.TICKET_ID_REQUIRED);
      }

      const result = await participantService.updateParticipant(
        ticketId,
        req.body as updateParticipant_Type,
      );

      SendResponse.SuccessResponse(res, result, ParticipantConstants.MESSAGES.PROFILE_UPDATED);
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
}

export const participantController = new ParticipantController();
export default participantController;
