import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { NotFoundError } from "../../../shared/errors/AppError";
import { GameConstants } from "./game.constants";
import {
  ICreateGameDto,
  IUpdateGameDto,
  IGameDetails,
  GameType,
  GameStatus,
} from "./game.types";

/**
 * GDG Ranchi DevFest 2026 - Game Management Service
 * Cloud Firestore document-driven games catalog and lifecycle management.
 */
export class GameService {
  public async CREATE_GAME(dto: ICreateGameDto): Promise<IGameDetails> {
    const gameId = "game-" + Date.now();
    const nowIso = new Date().toISOString();

    const gameDoc = {
      id: gameId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      gameType: dto.gameType,
      status: GameConstants.STATUS.UPCOMING,
      maxScore: dto.maxScore,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await dataStore.saveDocument("games", dataStore.games, gameDoc);
    logger.info(`Game created in Firestore: ${gameDoc.title} (${gameDoc.gameType})`);

    return {
      id: gameDoc.id,
      title: gameDoc.title,
      description: gameDoc.description,
      gameType: gameDoc.gameType as GameType,
      status: gameDoc.status as GameStatus,
      maxScore: gameDoc.maxScore,
      createdAt: new Date(gameDoc.createdAt),
      updatedAt: new Date(gameDoc.updatedAt),
    };
  }

  public async LIST_GAMES(): Promise<IGameDetails[]> {
    const games = await dataStore.games.getAll();
    return games.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      gameType: g.gameType as GameType,
      status: g.status as GameStatus,
      maxScore: g.maxScore,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
    }));
  }

  public async GET_GAME_BY_ID(gameId: string): Promise<IGameDetails | null> {
    const game = await dataStore.games.getById(gameId);
    if (!game) return null;

    return {
      id: game.id,
      title: game.title,
      description: game.description,
      gameType: game.gameType as GameType,
      status: game.status as GameStatus,
      maxScore: game.maxScore,
      createdAt: new Date(game.createdAt),
      updatedAt: new Date(game.updatedAt),
    };
  }

  public async UPDATE_GAME(
    gameId: string,
    dto: IUpdateGameDto,
  ): Promise<IGameDetails> {
    const game = await dataStore.games.getById(gameId);
    if (!game) {
      throw new NotFoundError(GameConstants.MESSAGES.GAME_NOT_FOUND);
    }

    const partial: Partial<typeof game> = {
      updatedAt: new Date().toISOString(),
    };
    if (dto.title !== undefined) partial.title = dto.title.trim();
    if (dto.description !== undefined) partial.description = dto.description.trim();
    if (dto.maxScore !== undefined) partial.maxScore = dto.maxScore;

    const updated = await dataStore.updateDocument(
      "games",
      dataStore.games,
      gameId,
      partial,
    );

    return {
      id: updated!.id,
      title: updated!.title,
      description: updated!.description,
      gameType: updated!.gameType as GameType,
      status: updated!.status as GameStatus,
      maxScore: updated!.maxScore,
      createdAt: new Date(updated!.createdAt),
      updatedAt: new Date(updated!.updatedAt),
    };
  }

  public async UPDATE_STATUS(
    gameId: string,
    status: GameStatus,
  ): Promise<IGameDetails> {
    const game = await dataStore.games.getById(gameId);
    if (!game) {
      throw new NotFoundError(GameConstants.MESSAGES.GAME_NOT_FOUND);
    }

    const updated = await dataStore.updateDocument("games", dataStore.games, gameId, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: updated!.id,
      title: updated!.title,
      description: updated!.description,
      gameType: updated!.gameType as GameType,
      status: updated!.status as GameStatus,
      maxScore: updated!.maxScore,
      createdAt: new Date(updated!.createdAt),
      updatedAt: new Date(updated!.updatedAt),
    };
  }
}
