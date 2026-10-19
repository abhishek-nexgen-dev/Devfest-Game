import ParticipantsUtils from "./Participants.Utils";
import { IParticipantDoc, IParticipantGameItem } from "./Participants.type";
import {
  bulkCreateParticipantValidator,
  createParticipant_Type,
  createParticipantValidator,
  joinParticipantGameValidator,
  ticketIdValidator,
  updateParticipantValidator,
} from "./Participants.validation";
import { ParticipantConstants } from "./participant.constants";
import { logger } from "../../../core/logger/logger";
import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";
import gameUtils from "../games/Games.Utils";
import { IAuthTokenPayload } from "../auth/Auth.type";
import GamesUtils from "../games/Games.Utils";
import { GameConstant } from "../games/game.constants";

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
   * Create Participants in Bulk (Accepts array or object with participants/data)
   */
  async createBulkParticipants(data: unknown): Promise<IParticipantDoc[]> {
    const validatedList = bulkCreateParticipantValidator.parse(data);

    // 1. Check for duplicates within the submitted payload itself
    const ticketIds = validatedList.map((p) => p.ticket_id.trim());
    const duplicateTicket = ticketIds.find((id, index) => ticketIds.indexOf(id) !== index);
    if (duplicateTicket) {
      throw new Error(`Duplicate ticket ID found in payload: ${duplicateTicket}`);
    }

    // 2. Check if any ticket_id already exists in the database
    const existingCheck = await pg.query<{ ticket_id: string }>(
      `SELECT ticket_id FROM ${COLLECTIONS.PARTICIPANTS} WHERE ticket_id = ANY($1::text[])`,
      [ticketIds],
    );
    if (existingCheck.rows.length > 0) {
      const existingList = existingCheck.rows.map((r) => r.ticket_id).join(", ");
      throw new Error(`Participants with ticket IDs already exist: ${existingList}`);
    }

    // 3. Auto-populate game_name for any initial games by looking up game_id in games table
    const gameNameCache = new Map<number, string>();
    for (const item of validatedList) {
      if (item.games && item.games.length > 0) {
        for (const g of item.games) {
          if (!g.game_name) {
            if (gameNameCache.has(g.game_id)) {
              g.game_name = gameNameCache.get(g.game_id);
            } else {
              const gameRes = await gameUtils.FIND_GAME_BY_ID(g.game_id);
              if (gameRes.rows.length > 0) {
                const fetchedName = gameRes.rows[0].game_name;
                gameNameCache.set(g.game_id, fetchedName);
                g.game_name = fetchedName;
              }
            }
          }
        }
      }
    }

    // 4. Batch insert participants into PostgreSQL
    const result = await ParticipantsUtils.CREATE_BULK_PARTICIPANTS(validatedList);

    logger.info(`🎟️ Bulk registered ${result.rows.length} participants.`);

    return result.rows;
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

    const existingIndex = currentGames.findIndex((g) => Number(g.game_id) === gameId);

    const firstGame = validated.games?.[0] || data?.games?.[0] || rawPayload?.games?.[0];
    const isCompleted = Boolean(firstGame?.isCompleted ?? firstGame?.is_completed);

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
    const updateResult = await ParticipantsUtils.UPDATE_PARTICIPANT_BY_TICKET_ID(
      effectiveTicketId,
      {
        games: currentGames,
      },
    );
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
   * - Public participants sending games delegate to joinGame
   * - Admins update profile fields directly (without games)
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

  /**
   * Update a Participant's score for a specific game
   * Updates the game's Total_game_point inside participant's games array,
   * sets isCompleted to true, and recalculates total_points via PostgreSQL trigger.
   */
  async updateParticipant_Game(
    ticketId: string,
    gameId: string | number,
    score: number,
    isCompleted: boolean = false,
  ): Promise<IParticipantDoc> {
    const effectiveTicketId = ticketId?.trim();

    if (!effectiveTicketId) {
      throw new Error(ParticipantConstants.MESSAGES.TICKET_ID_REQUIRED);
    }

    const numericGameId = Number(gameId);

    if (!gameId || isNaN(numericGameId) || numericGameId <= 0) {
      throw new Error(GameConstant.MESSAGES.GAME_ID_REQUIRED);
    }

    const numericScore = Number(score);

    if (score === undefined || isNaN(numericScore) || numericScore < 0) {
      throw new Error("Valid non-negative score is required.");
    }

    const findGameById = await GamesUtils.FIND_GAME_BY_ID(numericGameId);

    if (findGameById.rows.length === 0) {
      throw new Error(GameConstant.MESSAGES.GAME_NOT_FOUND);
    }

    const gameRecord = findGameById.rows[0];

    if (gameRecord.max_score !== undefined && numericScore > gameRecord.max_score) {
      throw new Error(
        `Score (${numericScore}) cannot exceed maximum allowed score of ${gameRecord.max_score}.`,
      );
    }

    // 2. Verify participant exists
    const participantRes = await ParticipantsUtils.FIND_PARTICIPANT_BY_TICKET_ID(effectiveTicketId);

    if (participantRes.rows.length === 0) {
      throw new Error(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const participant = participantRes.rows[0];

    // 3. Find and update game in participant's games array
    const currentGames: IParticipantGameItem[] = participant.games;

    const existingIndex = currentGames.findIndex((g) => Number(g.game_id) === numericGameId);

    if (existingIndex >= 0) {
      currentGames[existingIndex] = {
        game_id: numericGameId,
        game_name: gameRecord.game_name,
        Total_game_point: numericScore,
        isCompleted: isCompleted,
      };
    }

    if (isCompleted) {
      await pg.query(
        `UPDATE ${COLLECTIONS.GAMES} SET submissions = submissions + 1 WHERE id = $1::bigint;`,
        [numericGameId],
      );
    }

    // 5. Update participant in PostgreSQL
    // PostgreSQL trigger `validate_and_sync_participant_games` automatically
    // recalculates and sets `total_points` = SUM(Total_game_point)
    const updateResult = await ParticipantsUtils.UPDATE_PARTICIPANT_BY_TICKET_ID(
      effectiveTicketId,
      {
        games: currentGames,
      },
    );

    logger.info(
      `🎯 Game score updated for participant [${effectiveTicketId}] - Game [${numericGameId}]: ${numericScore} pts, Total: ${updateResult.rows[0]?.total_points} pts`,
    );

    return updateResult.rows[0];
  }
}

export const participantService = new ParticipantService();
export default participantService;
