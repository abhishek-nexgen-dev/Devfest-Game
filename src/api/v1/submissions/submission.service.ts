import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { BadRequestError, ConflictError } from "../../../shared/errors/AppError";
import { SubmissionConstants } from "./submission.constants";
import { ICreateSubmissionDto, ISubmissionRecord } from "./submission.types";

/**
 * GDG Ranchi DevFest 2026 - Game Submission Service
 * Cloud Firestore document-driven submission intake and automatic score zero-initialization.
 */
export class SubmissionService {
  public async SUBMIT(
    participantId: string,
    dto: ICreateSubmissionDto,
  ): Promise<ISubmissionRecord> {
    const isRegistered = await dataStore.registrations.findOne(
      (r) =>
        r.gameId === dto.gameId &&
        (dto.teamId ? r.teamId === dto.teamId : r.participantId === participantId),
    );
    if (!isRegistered) {
      throw new BadRequestError(SubmissionConstants.MESSAGES.NOT_REGISTERED);
    }

    const existingSub = await dataStore.submissions.findOne(
      (s) =>
        s.gameId === dto.gameId &&
        (dto.teamId ? s.teamId === dto.teamId : s.participantId === participantId),
    );
    if (existingSub) {
      throw new ConflictError(SubmissionConstants.MESSAGES.ALREADY_SUBMITTED);
    }

    const subId = "sub-" + Date.now();
    const nowIso = new Date().toISOString();

    const subDoc = {
      id: subId,
      gameId: dto.gameId,
      participantId: dto.teamId ? null : participantId,
      teamId: dto.teamId || null,
      submissionData: dto.submissionData,
      submittedAt: nowIso,
    };

    await dataStore.saveDocument("submissions", dataStore.submissions, subDoc);

    // Initialize Result with Score = 0
    const resultDoc = {
      id: "res-" + Date.now(),
      gameId: dto.gameId,
      participantId: dto.teamId ? null : participantId,
      teamId: dto.teamId || null,
      score: 0,
      points: 0,
      verified: false,
      verifiedBy: null,
      updatedAt: nowIso,
    };
    await dataStore.saveDocument("results", dataStore.results, resultDoc);

    logger.info(`Submission recorded in Firestore for game ${dto.gameId} [${subId}]`);

    return {
      id: subDoc.id,
      gameId: subDoc.gameId,
      participantId: subDoc.participantId,
      teamId: subDoc.teamId,
      submissionData: subDoc.submissionData,
      submittedAt: new Date(subDoc.submittedAt),
    };
  }

  public async GET_PARTICIPANT_SUBMISSIONS(
    participantId: string,
  ): Promise<ISubmissionRecord[]> {
    const subs = await dataStore.submissions.find(
      (s) => s.participantId === participantId,
    );
    return subs.map((s) => ({
      id: s.id,
      gameId: s.gameId,
      participantId: s.participantId,
      teamId: s.teamId,
      submissionData: s.submissionData,
      submittedAt: new Date(s.submittedAt),
    }));
  }

  public async GET_GAME_SUBMISSIONS(gameId: string): Promise<ISubmissionRecord[]> {
    const subs = await dataStore.submissions.find((s) => s.gameId === gameId);
    return subs.map((s) => ({
      id: s.id,
      gameId: s.gameId,
      participantId: s.participantId,
      teamId: s.teamId,
      submissionData: s.submissionData,
      submittedAt: new Date(s.submittedAt),
    }));
  }
}
