import ParticipantsUtils from "./Participants.Utils";
import { IParticipantDoc, IParticipantGameItem, JoinGameType } from "./Participants.type";
import {
  createParticipant_Type,
  createParticipantValidator,
  joinParticipantGameValidator,
  ticketIdValidator,
  updateParticipant_Type,
  updateParticipantValidator,
} from "./Participants.validation";
import { ParticipantConstants } from "./participant.constants";
import { logger } from "../../../core/logger/logger";
import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";
import gameUtils from "../games/Games.Utils";
import { IAuthTokenPayload } from "../auth/Auth.type";

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

    // Auto-populate game_name for any initial games by looking up game_id in games table
    if (validatedData.games && validatedData.games.length > 0) {
      for (const item of validatedData.games) {
        if (!item.game_name) {
          const gameRes = await gameUtils.FIND_GAME_BY_ID(item.game_id);
          if (gameRes.rows.length > 0) {
            item.game_name = gameRes.rows[0].game_name;
          }
        }
      }
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
   * Join Game Flow
   * Called by controller: participantService.joinGame(ticketId, req.body, req.user)
   *
   * 1. Validate ticket_id and email
   * 2. Find participant by ticket_id & email (throw if not found / mismatch)
   * 3. Extract game_id (or games array)
   * 4. Check if already joined (throw error if already joined)
   * 5. Verify game exists in database & lookup game_name
   * 6. Push new game to participant's games array
   * 7. Save updated games to PostgreSQL and update registrations counter
   */
  async joinGame(
    ticketIdOrData: string | any,
    data?: any,
    _user?: IAuthTokenPayload,
  ): Promise<{ participant: IParticipantDoc; message: string }> {
    const rawPayload =
      typeof ticketIdOrData === "string"
        ? { ...data, ticket_id: ticketIdOrData }
        : ticketIdOrData || {};

    // 1. Validate payload with Zod — no hardcoded checks
    const validated = joinParticipantGameValidator.parse(rawPayload);
    const effectiveTicketId = validated.ticket_id;
    const email = validated.email;
    const gameId = Number(validated.game_id ?? validated.games?.[0]?.game_id);

    // 2. Verify participant exists and email matches ticket ID
    const participantResult = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_AND_EMAIL(
      effectiveTicketId,
      email,
    );

    if (participantResult.rows.length === 0) {
      const ticketCheck = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_ID(effectiveTicketId);
      if (ticketCheck.rows.length === 0) {
        throw new Error("You can't join game. Participant not found.");
      }
      throw new Error("You can't join game. Provided email does not match this ticket ID.");
    }
    const currentParticipant = participantResult.rows[0];

    // 3. Check if participant has already joined this game
    const currentGames: IParticipantGameItem[] = Array.isArray(currentParticipant.games)
      ? [...currentParticipant.games]
      : [];

    const existingIndex = currentGames.findIndex(
      (g) => Number(g.game_id) === gameId,
    );

    const isCompleted = Boolean(
      data?.isCompleted ?? data?.is_completed ?? data?.games?.[0]?.isCompleted ?? data?.games?.[0]?.is_completed ?? false,
    );

    if (existingIndex >= 0) {
      if (isCompleted) {
        if (!currentGames[existingIndex].isCompleted) {
          currentGames[existingIndex].isCompleted = true;
          await pg.query(
            `UPDATE ${COLLECTIONS.GAMES} SET submissions = submissions + 1 WHERE id = $1::bigint;`,
            [gameId],
          );
        }
      } else {
        throw new Error("You can't join game. You have already joined this game.");
      }
    } else {
      // 4. Find game by ID in database to retrieve official game_name
      const gameRes = await gameUtils.FIND_GAME_BY_ID(gameId);
      if (gameRes.rows.length === 0) {
        throw new Error(`You can't join game. Game with ID ${gameId} does not exist.`);
      }
      const gameRecord = gameRes.rows[0];

      // 5. Add game to participant's games array
      currentGames.push({
        game_id: gameId,
        game_name: gameRecord.game_name,
        Total_game_point: 0,
        isCompleted: false,
      });

      // 6. Increment registrations counter on games table
      await pg.query(
        `UPDATE ${COLLECTIONS.GAMES} SET registrations = registrations + 1 WHERE id = $1::bigint;`,
        [gameId],
      );
    }

    // 7. Update participant in PostgreSQL
    const updateResult = await ParticipantsUtils.UPDATE_PARTICIPANT_BY_TICKET_ID(effectiveTicketId, {
      games: currentGames,
    });
    const updatedParticipant = updateResult.rows[0];

    logger.info(
      `🎮 Public participant joined game: ${currentParticipant.email} [${effectiveTicketId}] game_id: ${gameId}`,
    );

    return {
      participant: updatedParticipant,
      message: ParticipantConstants.MESSAGES.GAME_JOINED,
    };
  }

  /**
   * Update Participant based on ticket_id
   * Validates ticket_id and payload with Zod
   */
  async updateParticipant(
    ticketId: string,
    data: any,
    user?: IAuthTokenPayload,
  ): Promise<{ participant: IParticipantDoc; message: string }> {
    // 1. Validate ticket_id with Zod — no hardcoded checks
    const effectiveTicketId = ticketIdValidator.parse(
      (typeof ticketId === "string" ? ticketId : "") ||
      (typeof data?.ticket_id === "string" ? data.ticket_id : "") ||
      (typeof data?.ticketId === "string" ? data.ticketId : ""),
    );

    const isAdmin = !!(user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN"));

    // Case 1: Public Participant Flow -> Delegate to joinGame
    if (!isAdmin) {
      return this.joinGame(effectiveTicketId, data, user);
    }

    // Case 2: Authenticated SUPER_ADMIN / ADMIN Flow -> Update participant based on ticket_id
    // 2. Validate update data with Zod — no hardcoded checks
    const validatedData = updateParticipantValidator.parse(data);

    // 3. Verify participant exists in database by ticket_id
    const existing = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_ID(effectiveTicketId);
    if (existing.rows.length === 0) {
      throw new Error(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    // 4. Update participant profile directly in PostgreSQL (no games update, no loop)
    const { games: _games, ...payloadToUpdate } = validatedData;

    const result = await ParticipantsUtils.UPDATE_PARTICIPANT_BY_TICKET_ID(
      effectiveTicketId,
      payloadToUpdate,
    );
    const updatedParticipant = result.rows[0];

    logger.info(`✏️ Participant updated based on ticket_id: [${effectiveTicketId}]`);

    return {
      participant: updatedParticipant,
      message: ParticipantConstants.MESSAGES.PROFILE_UPDATED,
    };
  }
}

export const participantService = new ParticipantService();
export default participantService;
