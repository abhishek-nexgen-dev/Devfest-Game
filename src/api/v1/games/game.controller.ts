import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.util";
import { GameConstants } from "./game.constants";
import { GameService } from "./game.service";

/**
 * GDG Ranchi DevFest 2026 - Game Controller
 */
export class GameController {
  private readonly gameService: GameService;

  constructor(gameService: GameService = new GameService()) {
    this.gameService = gameService;
  }

  public CREATE = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.CREATE_GAME(req.body);
      sendSuccess(res, game, GameConstants.MESSAGES.GAME_CREATED, 201);
    } catch (error) {
      next(error);
    }
  };

  public LIST = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const games = await this.gameService.LIST_GAMES();
      sendSuccess(res, games, GameConstants.MESSAGES.GAMES_LISTED, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_BY_ID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.GET_GAME_BY_ID(req.params.id);
      sendSuccess(res, game, GameConstants.MESSAGES.GAME_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  public UPDATE = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.UPDATE_GAME(req.params.id, req.body);
      sendSuccess(res, game, GameConstants.MESSAGES.GAME_UPDATED, 200);
    } catch (error) {
      next(error);
    }
  };

  public ACTIVATE = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.SET_GAME_STATUS(
        req.params.id,
        GameConstants.GAME_STATUS.ACTIVE,
      );
      sendSuccess(res, game, GameConstants.MESSAGES.GAME_ACTIVATED, 200);
    } catch (error) {
      next(error);
    }
  };

  public CLOSE = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.SET_GAME_STATUS(
        req.params.id,
        GameConstants.GAME_STATUS.CLOSED,
      );
      sendSuccess(res, game, GameConstants.MESSAGES.GAME_CLOSED, 200);
    } catch (error) {
      next(error);
    }
  };
}
