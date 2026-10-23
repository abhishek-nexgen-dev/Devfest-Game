import GamesUtils from "./Games.Utils";
import { GameType } from "./Game.Type";
import {
  createGame_Type,
  createGameValidator,
  updateGame_Type,
  updateGameValidator,
  gameQueryValidator,
} from "./Games.validation";
import { GameConstants } from "./game.constants";
import { logger } from "../../../core/logger/logger";
import { QueryResult } from "pg";
import pg from "../../../core/database/postgres";
import { COLLECTIONS } from "../../../constants/collections";

class GameService {
  /**
   * Create a new Game
   */
  CREATE_GAME = async (data: createGame_Type): Promise<QueryResult<GameType>> => {
    // If is_completed is true and status not explicitly provided, align status to COMPLETED
    const preparedData = {
      ...data,
      status: data.is_completed && (!data.status || data.status === "ACTIVE") ? "COMPLETED" : data.status,
    };

    const validatedData = createGameValidator.parse(preparedData);

    // Check if a game with this name already exists
    const exists = await GamesUtils.isGameExist(validatedData.game_name);
    if (exists && !validatedData.id) {
      throw new Error(GameConstants.MESSAGES.GAME_ALREADY_EXISTS);
    }

    const result = await GamesUtils.CREATE_GAME(validatedData);
    logger.info(`🎮 Game created/upserted: ${result.rows[0]?.game_name} [ID: ${result.rows[0]?.id}] [Type: ${result.rows[0]?.game_type}]`);

    return result;
  };

  /**
   * Update an existing Game by ID
   */
  UPDATE_GAME_BY_ID = async (
    id: string | number,
    data: updateGame_Type,
  ): Promise<QueryResult<GameType>> => {
    if (!id) {
      throw new Error(GameConstants.MESSAGES.GAME_ID_REQUIRED);
    }

    // 1. Check if the game exists (by ID or name)
    const existingResult = await GamesUtils.FIND_GAME_BY_ID(id);
    if (existingResult.rows.length === 0) {
      throw new Error(GameConstants.MESSAGES.GAME_NOT_FOUND);
    }
    const existingGame = existingResult.rows[0];
    const targetNumericId = Number(existingGame.id);

    // If is_completed is true and status not provided, auto-set to COMPLETED
    const preparedData = {
      ...data,
      status: data.is_completed && !data.status ? "COMPLETED" : data.status,
      is_completed: data.status === "COMPLETED" && data.is_completed === undefined ? true : data.is_completed,
    };

    const validatedData = updateGameValidator.parse(preparedData);

    // 2. Check for duplicate game_name if renaming
    if (
      validatedData.game_name &&
      validatedData.game_name.trim().toLowerCase() !== existingGame.game_name.toLowerCase()
    ) {
      const nameExists = await GamesUtils.isGameExist(validatedData.game_name);
      if (nameExists) {
        throw new Error(GameConstants.MESSAGES.GAME_ALREADY_EXISTS);
      }
    }

    // 3. Validate effective start_time and end_time
    const effectiveStartTime = validatedData.start_time
      ? new Date(validatedData.start_time)
      : new Date(existingGame.start_time);
    const effectiveEndTime = validatedData.end_time
      ? new Date(validatedData.end_time)
      : new Date(existingGame.end_time);

    if (effectiveEndTime < effectiveStartTime) {
      throw new Error(GameConstants.MESSAGES.INVALID_TIME_RANGE);
    }

    // 4. Update the game in PostgreSQL
    const result = await GamesUtils.UPDATE_GAME_BY_ID(targetNumericId, validatedData);
    if (result.rows.length === 0) {
      throw new Error(GameConstants.MESSAGES.GAME_NOT_FOUND);
    }

    // 5. If game_name was renamed, synchronize participant documents
    if (
      validatedData.game_name &&
      validatedData.game_name.trim().toLowerCase() !== existingGame.game_name.toLowerCase()
    ) {
      await pg.query(
        `UPDATE ${COLLECTIONS.PARTICIPANTS}
         SET games = games
         WHERE games @> jsonb_build_array(jsonb_build_object('game_id', $1::bigint));`,
        [targetNumericId],
      );
    }

    logger.info(`✏️ Game updated: ${result.rows[0]?.game_name} [ID: ${result.rows[0]?.id}] [Type: ${result.rows[0]?.game_type}]`);
    return result;
  };

  /**
   * Fetch games with search, filtering, sorting, and pagination
   */
  FIND_ALL_GAMES = async (query?: any) => {
    const validatedQuery = gameQueryValidator.parse(query || {});
    return GamesUtils.FIND_PAGINATED_GAMES(validatedQuery);
  };

  /**
   * Fetch Game by ID
   */
  FIND_GAME_BY_ID = async (id: string | number): Promise<QueryResult<GameType>> => {
    if (!id) {
      throw new Error(GameConstants.MESSAGES.GAME_ID_REQUIRED);
    }

    const result = await GamesUtils.FIND_GAME_BY_ID(id);
    if (result.rows.length === 0) {
      throw new Error(GameConstants.MESSAGES.GAME_NOT_FOUND);
    }

    return result;
  };

  /**
   * Fetch Game by Name
   */
  FIND_GAME_BY_NAME = async (name: string): Promise<QueryResult<GameType>> => {
    if (!name || !name.trim()) {
      throw new Error("Game name is required.");
    }

    const result = await GamesUtils.FIND_GAME_BY_NAME(name.trim());
    if (result.rows.length === 0) {
      throw new Error(GameConstants.MESSAGES.GAME_NOT_FOUND);
    }

    return result;
  };

  /**
   * Activate Game (sets status to ACTIVE)
   */
  activateGame = async (id: string | number): Promise<QueryResult<GameType>> => {
    return this.UPDATE_GAME_BY_ID(id, { status: "ACTIVE" as any, is_completed: false });
  };

  /**
   * Close Game (sets status to CLOSED)
   */
  closeGame = async (id: string | number): Promise<QueryResult<GameType>> => {
    return this.UPDATE_GAME_BY_ID(id, { status: "CLOSED" as any });
  };

  // Modern camelCase aliases
  createGame = (data: createGame_Type) => this.CREATE_GAME(data);
  updateGame = (id: string | number, data: updateGame_Type) => this.UPDATE_GAME_BY_ID(id, data);
  getAllGames = (filters?: { type?: string; status?: string }) => this.FIND_ALL_GAMES(filters);
  getGameById = (id: string | number) => this.FIND_GAME_BY_ID(id);
  getGameByName = (name: string) => this.FIND_GAME_BY_NAME(name);
}

export const gameService = new GameService();
export default gameService;
