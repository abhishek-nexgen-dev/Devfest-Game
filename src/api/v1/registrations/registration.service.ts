import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { BadRequestError, ConflictError } from "../../../shared/errors/AppError";
import { RegistrationConstants } from "./registration.constants";
import { IRegisterGameDto, IRegistrationRecord } from "./registration.types";

/**
 * GDG Ranchi DevFest 2026 - Game Registration Service
 * Cloud Firestore document-driven registrations with duplicate enrollment protection.
 */
export class RegistrationService {
  public async REGISTER_FOR_GAME(
    participantId: string,
    dto: IRegisterGameDto,
  ): Promise<IRegistrationRecord> {
    const game = await dataStore.games.getById(dto.gameId);
    if (!game) {
      throw new BadRequestError(RegistrationConstants.MESSAGES.GAME_CLOSED);
    }
    if (game.status !== "ACTIVE") {
      throw new BadRequestError(RegistrationConstants.MESSAGES.GAME_CLOSED);
    }

    // Duplicate check
    const existing = await dataStore.registrations.findOne(
      (r) =>
        r.gameId === dto.gameId &&
        (dto.teamId ? r.teamId === dto.teamId : r.participantId === participantId),
    );
    if (existing) {
      throw new ConflictError(RegistrationConstants.MESSAGES.ALREADY_REGISTERED);
    }

    const regId = "reg-" + Date.now();
    const nowIso = new Date().toISOString();

    const regDoc = {
      id: regId,
      gameId: dto.gameId,
      participantId: dto.teamId ? null : participantId,
      teamId: dto.teamId || null,
      registeredAt: nowIso,
    };

    await dataStore.saveDocument("registrations", dataStore.registrations, regDoc);
    logger.info(
      `Registration recorded in Firestore for game ${dto.gameId} [${participantId}]`,
    );

    return {
      id: regDoc.id,
      gameId: regDoc.gameId,
      participantId: regDoc.participantId,
      teamId: regDoc.teamId,
      registeredAt: new Date(regDoc.registeredAt),
    };
  }

  public async GET_PARTICIPANT_REGISTRATIONS(
    participantId: string,
  ): Promise<IRegistrationRecord[]> {
    const regs = await dataStore.registrations.find(
      (r) => r.participantId === participantId,
    );
    return regs.map((r) => ({
      id: r.id,
      gameId: r.gameId,
      participantId: r.participantId,
      teamId: r.teamId,
      registeredAt: new Date(r.registeredAt),
    }));
  }

  public async GET_GAME_REGISTRATIONS(gameId: string): Promise<IRegistrationRecord[]> {
    const regs = await dataStore.registrations.find((r) => r.gameId === gameId);
    return regs.map((r) => ({
      id: r.id,
      gameId: r.gameId,
      participantId: r.participantId,
      teamId: r.teamId,
      registeredAt: new Date(r.registeredAt),
    }));
  }
}
