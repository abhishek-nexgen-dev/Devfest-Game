import ParticipantsUtils from "./Participants.Utils";
import { IParticipantDoc } from "./Participants.type";
import {
  createParticipant_Type,
  createParticipantValidator,
  updateParticipant_Type,
  updateParticipantValidator,
} from "./Participants.validation";
import { ParticipantConstants } from "./participant.constants";
import { logger } from "../../../core/logger/logger";

class ParticipantService {
  /**
   * Create a new Participant (Public — anyone can create)
   */
  async createParticipant(data: createParticipant_Type): Promise<IParticipantDoc> {
    const validatedData = createParticipantValidator.parse(data);

    // 1. Check if ticket_id already exists
    const existingTicket = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_ID(
      validatedData.ticket_id,
    );
    if (existingTicket.rows.length > 0) {
      throw new Error(ParticipantConstants.MESSAGES.TICKET_ALREADY_EXISTS);
    }

    // 2. Insert participant into PostgreSQL
    const result = await ParticipantsUtils.CREATE_PARTICIPANT(validatedData);
    const createdParticipant = result.rows[0];

    logger.info(
      `🎟️ Participant registered: ${createdParticipant.email} [${createdParticipant.ticket_id}]`,
    );

    return createdParticipant;
  }

  /**
   * Get all Participants
   */
  async getAllParticipants(): Promise<IParticipantDoc[]> {
    const result = await ParticipantsUtils.FIND_ALL_PARTICIPANT();
    return result.rows;
  }

  /**
   * Get a Participant by Ticket ID
   */
  async getParticipantByTicketId(ticketId: string): Promise<IParticipantDoc> {
    if (!ticketId) {
      throw new Error(ParticipantConstants.MESSAGES.TICKET_ID_REQUIRED);
    }

    const result = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_ID(ticketId);
    if (result.rows.length === 0) {
      throw new Error(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    return result.rows[0];
  }

  /**
   * Update a Participant by Ticket ID (SUPER_ADMIN & ADMIN only)
   */
  async updateParticipant(
    ticketId: string,
    data: updateParticipant_Type,
  ): Promise<IParticipantDoc> {
    if (!ticketId) {
      throw new Error(ParticipantConstants.MESSAGES.TICKET_ID_REQUIRED);
    }

    const validatedData = updateParticipantValidator.parse(data);

    const existing = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_ID(ticketId);
    if (existing.rows.length === 0) {
      throw new Error(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const result = await ParticipantsUtils.UPDATE_PARTICIPANT_BY_TICKET_ID(ticketId, validatedData);
    const updatedParticipant = result.rows[0];

    logger.info(`✏️ Participant updated: [${ticketId}]`);

    return updatedParticipant;
  }
}

export const participantService = new ParticipantService();
export default participantService;
