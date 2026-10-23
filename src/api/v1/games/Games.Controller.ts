import { Request, Response } from "express";
import { GameConstants } from "./game.constants";
import { createGame_Type, updateGame_Type } from "./Games.validation";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import SendResponse from "../../../utils/SendResponse";
import { gameService } from "./Game.Service";

export class GameController {
  /**
   * Create a new Game (SUPER_ADMIN & ADMIN or Public Arena Manager)
   * POST /api/v1/game/create | POST /api/v1/games
   */
  async createGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const payload = {
        ...req.body,
        created_by: req.user?.id || req.body?.created_by || null,
      };

      const result = await gameService.CREATE_GAME(payload as createGame_Type);

      SendResponse.SuccessResponse(res, result.rows[0], GameConstants.MESSAGES.GAME_CREATED);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to create game";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Fetch all Games (Public)
   * Supports pagination, search, format filtering, status, track, and sorting:
   * ?page=1&limit=10&search=quiz&type=QUIZ_ARENA&status=ACTIVE&track=Flagship%20Dev%20Track&sort_by=id&order=ASC
   * GET /api/v1/game/get | GET /api/v1/games
   */
  async fetchAllGames(req: Request, res: Response): Promise<void> {
    try {
      const result = await gameService.FIND_ALL_GAMES(req.query);

      // Support legacy consumers requesting raw array if all=true and not explicitly requesting paginated envelope
      if (req.query.all === "true" && req.query.paginated !== "true") {
        SendResponse.SuccessResponse(res, result.rows, GameConstants.MESSAGES.GAMES_LISTED);
        return;
      }

      SendResponse.SuccessResponse(
        res,
        {
          games: result.rows,
          pagination: result.pagination,
        },
        GameConstants.MESSAGES.GAMES_LISTED,
      );
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : "Failed to fetch games",
      );
    }
  }

  /**
   * Fetch a single Game by ID (Public)
   * GET /api/v1/game/:id | GET /api/v1/games/:id
   */
  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !id.trim()) {
        throw new Error(GameConstants.MESSAGES.GAME_ID_REQUIRED);
      }

      const result = await gameService.FIND_GAME_BY_ID(id);

      SendResponse.SuccessResponse(res, result.rows[0], GameConstants.MESSAGES.GAME_FETCHED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : GameConstants.MESSAGES.GAME_NOT_FOUND,
      );
    }
  }

  /**
   * Update an existing Game by ID (SUPER_ADMIN & ADMIN or Arena Manager)
   * PATCH / PUT /api/v1/game/:id | PATCH / PUT /api/v1/games/:id
   */
  async updateGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !id.trim()) {
        throw new Error(GameConstants.MESSAGES.GAME_ID_REQUIRED);
      }

      const result = await gameService.UPDATE_GAME_BY_ID(id, req.body as updateGame_Type);

      SendResponse.SuccessResponse(res, result.rows[0], GameConstants.MESSAGES.GAME_UPDATED);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to update game";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Fetch a single Game by Name (Public)
   * GET /api/v1/game/name/:name | GET /api/v1/games/name/:name
   */
  async getGameByName(req: Request, res: Response): Promise<void> {
    try {
      const name = req.params.name as string;
      if (!name || !name.trim()) {
        throw new Error("Game name is required.");
      }

      const result = await gameService.FIND_GAME_BY_NAME(name);

      SendResponse.SuccessResponse(res, result.rows[0], GameConstants.MESSAGES.GAME_FETCHED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : GameConstants.MESSAGES.GAME_NOT_FOUND,
      );
    }
  }

  /**
   * Activate Game by ID (SUPER_ADMIN & ADMIN or Arena Manager)
   * PATCH /api/v1/game/:id/activate | PATCH /api/v1/games/:id/activate
   */
  async activateGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !id.trim()) {
        throw new Error(GameConstants.MESSAGES.GAME_ID_REQUIRED);
      }

      const result = await gameService.activateGame(id);

      SendResponse.SuccessResponse(res, result.rows[0], GameConstants.MESSAGES.GAME_ACTIVATED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : "Failed to activate game",
      );
    }
  }

  /**
   * Close Game by ID (SUPER_ADMIN & ADMIN or Arena Manager)
   * PATCH /api/v1/game/:id/close | PATCH /api/v1/games/:id/close
   */
  async closeGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !id.trim()) {
        throw new Error(GameConstants.MESSAGES.GAME_ID_REQUIRED);
      }

      const result = await gameService.closeGame(id);

      SendResponse.SuccessResponse(res, result.rows[0], GameConstants.MESSAGES.GAME_CLOSED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : "Failed to close game",
      );
    }
  }
}

export const gameController = new GameController();
export default gameController;
