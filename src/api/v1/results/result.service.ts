import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { BadRequestError } from "../../../shared/errors/AppError";
import { IUpdateScoreDto, IResultRecord, IScoreLogItem } from "./result.types";

/**
 * GDG Ranchi DevFest 2026 - Score Moderation Service
 * Cloud Firestore document-driven scoring and immutable audit logging.
 */
export class ResultService {
  public async UPDATE_SCORE(
    adminEmail: string,
    dto: IUpdateScoreDto,
  ): Promise<IResultRecord> {
    const game = await dataStore.games.getById(dto.gameId);
    if (!game) {
      throw new BadRequestError("Game not found.");
    }

    if (dto.score > game.maxScore) {
      throw new BadRequestError(`Score exceeds game maximum allowed (${game.maxScore}).`);
    }

    let existing = await dataStore.results.findOne(
      (r) =>
        r.gameId === dto.gameId &&
        (dto.teamId ? r.teamId === dto.teamId : r.participantId === dto.participantId),
    );

    const oldScore = existing?.score ?? 0;
    const nowIso = new Date().toISOString();

    if (existing) {
      existing = await dataStore.updateDocument("results", dataStore.results, existing.id, {
        score: dto.score,
        points: dto.score,
        verified: true,
        verifiedBy: adminEmail,
        updatedAt: nowIso,
      });
    } else {
      const resultDoc = {
        id: "res-" + Date.now(),
        gameId: dto.gameId,
        participantId: dto.teamId ? null : dto.participantId || null,
        teamId: dto.teamId || null,
        score: dto.score,
        points: dto.score,
        verified: true,
        verifiedBy: adminEmail,
        updatedAt: nowIso,
      };
      existing = await dataStore.saveDocument("results", dataStore.results, resultDoc);
    }

    // Create Audit Log in score_logs
    const logDoc = {
      id: "log-" + Date.now(),
      gameId: dto.gameId,
      participantId: dto.participantId || null,
      teamId: dto.teamId || null,
      oldScore,
      newScore: dto.score,
      updatedBy: adminEmail,
      reason: dto.reason || "Score verified by Super Admin",
      createdAt: nowIso,
    };
    await dataStore.saveDocument("score_logs", dataStore.scoreLogs, logDoc);

    logger.info(
      `Score updated in Firestore for game ${dto.gameId}: ${oldScore} -> ${dto.score} by ${adminEmail}`,
    );

    return {
      id: existing!.id,
      gameId: existing!.gameId,
      participantId: existing!.participantId,
      teamId: existing!.teamId,
      score: existing!.score,
      verified: existing!.verified,
      verifiedBy: existing!.verifiedBy,
      updatedAt: new Date(existing!.updatedAt),
    };
  }

  public async GET_PARTICIPANT_RESULT(
    gameId: string,
    participantId: string,
  ): Promise<IResultRecord | null> {
    const res = await dataStore.results.findOne(
      (r) => r.gameId === gameId && r.participantId === participantId,
    );
    if (!res) return null;

    return {
      id: res.id,
      gameId: res.gameId,
      participantId: res.participantId,
      teamId: res.teamId,
      score: res.score,
      verified: res.verified,
      verifiedBy: res.verifiedBy,
      updatedAt: new Date(res.updatedAt),
    };
  }

  public async GET_GAME_RESULTS(gameId: string): Promise<IResultRecord[]> {
    const results = await dataStore.results.find((r) => r.gameId === gameId);
    return results.map((r) => ({
      id: r.id,
      gameId: r.gameId,
      participantId: r.participantId,
      teamId: r.teamId,
      score: r.score,
      verified: r.verified,
      verifiedBy: r.verifiedBy,
      updatedAt: new Date(r.updatedAt),
    }));
  }

  public async LIST_SCORE_LOGS(gameId?: string): Promise<IScoreLogItem[]> {
    const logs = await dataStore.scoreLogs.getAll();
    const filtered = gameId ? logs.filter((l) => l.gameId === gameId) : logs;

    return filtered.map((l) => ({
      id: l.id,
      gameId: l.gameId,
      participantId: l.participantId,
      teamId: l.teamId,
      oldScore: l.oldScore,
      newScore: l.newScore,
      updatedBy: l.updatedBy,
      reason: l.reason,
      createdAt: new Date(l.createdAt),
    }));
  }
}
