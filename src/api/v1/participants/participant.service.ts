import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { NotFoundError } from "../../../shared/errors/AppError";
import { ParticipantConstants } from "./participant.constants";
import { AuthService, StoredParticipant } from "../auth/auth.service";
import {
  IUpdateParticipantDto,
  IParticipantFilterQuery,
  IParticipantListResponse,
  IParticipantGameItem,
  IParticipantTeamDetails,
  IParticipantScoreSummary,
} from "./participant.types";
import { ISanitizedParticipant } from "../auth/auth.types";

/**
 * GDG Ranchi DevFest 2026 - Participant Service
 * Manages participant profiles, team memberships, game enrollments, and scores via Cloud Firestore.
 */
export class ParticipantService {
  /**
   * Find participant record by primary UUID.
   */
  public async FIND_PARTICIPANT_BY_ID(id: string): Promise<StoredParticipant | null> {
    const doc = await dataStore.participants.getById(id);
    if (doc) {
      return {
        id: doc.id,
        userId: doc.userId,
        participantId: doc.participantId,
        name: doc.name,
        mobile: doc.mobile,
        organization: doc.organization,
        city: doc.city,
        profilePhoto: doc.profilePhoto,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }

    return AuthService.memoryParticipants.get(id) || null;
  }

  /**
   * Find participant record by foreign user UUID.
   */
  public async FIND_PARTICIPANT_BY_USER_ID(
    userId: string,
  ): Promise<StoredParticipant | null> {
    const doc = await dataStore.participants.findOne((p) => p.userId === userId);
    if (doc) {
      return {
        id: doc.id,
        userId: doc.userId,
        participantId: doc.participantId,
        name: doc.name,
        mobile: doc.mobile,
        organization: doc.organization,
        city: doc.city,
        profilePhoto: doc.profilePhoto,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }

    for (const p of AuthService.memoryParticipants.values()) {
      if (p.userId === userId) return p;
    }

    return null;
  }

  /**
   * Find participant record by public identification code (GDGR-XXXX).
   */
  public async FIND_PARTICIPANT_BY_CODE(
    participantId: string,
  ): Promise<StoredParticipant | null> {
    const doc = await dataStore.participants.findOne(
      (p) => p.participantId === participantId,
    );
    if (doc) {
      return {
        id: doc.id,
        userId: doc.userId,
        participantId: doc.participantId,
        name: doc.name,
        mobile: doc.mobile,
        organization: doc.organization,
        city: doc.city,
        profilePhoto: doc.profilePhoto,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }

    for (const p of AuthService.memoryParticipants.values()) {
      if (p.participantId === participantId) return p;
    }

    return null;
  }

  /**
   * List participants with optional query filtering and pagination (Super Admin).
   */
  public async LIST_PARTICIPANTS(
    query: IParticipantFilterQuery,
  ): Promise<IParticipantListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));

    let all = await dataStore.participants.getAll();

    // If dataStore is empty, merge from memoryParticipants
    if (all.length === 0 && AuthService.memoryParticipants.size > 0) {
      all = Array.from(AuthService.memoryParticipants.values()).map((p) => ({
        id: p.id,
        userId: p.userId,
        participantId: p.participantId,
        name: p.name,
        mobile: p.mobile,
        organization: p.organization,
        city: p.city,
        profilePhoto: p.profilePhoto,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.participantId.toLowerCase().includes(s) ||
          p.mobile.includes(s) ||
          (p.organization && p.organization.toLowerCase().includes(s)),
      );
    }
    if (query.organization) {
      const org = query.organization.toLowerCase();
      all = all.filter((p) => p.organization && p.organization.toLowerCase().includes(org));
    }
    if (query.city) {
      const c = query.city.toLowerCase();
      all = all.filter((p) => p.city && p.city.toLowerCase().includes(c));
    }

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return {
      participants: paginated.map((p) => ({
        id: p.id,
        userId: p.userId,
        participantId: p.participantId,
        name: p.name,
        mobile: p.mobile,
        organization: p.organization,
        city: p.city,
        profilePhoto: p.profilePhoto,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Updates participant profile information.
   */
  public async UPDATE_PARTICIPANT_PROFILE(
    userId: string,
    dto: IUpdateParticipantDto,
  ): Promise<ISanitizedParticipant> {
    const participant = await this.FIND_PARTICIPANT_BY_USER_ID(userId);
    if (!participant) {
      throw new NotFoundError(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const updatedData: Partial<typeof participant> = {
      updatedAt: new Date(),
    };
    if (dto.name !== undefined) updatedData.name = dto.name.trim();
    if (dto.mobile !== undefined) updatedData.mobile = dto.mobile.trim();
    if (dto.organization !== undefined)
      updatedData.organization = dto.organization.trim() || null;
    if (dto.city !== undefined) updatedData.city = dto.city.trim() || null;
    if (dto.profilePhoto !== undefined) updatedData.profilePhoto = dto.profilePhoto || null;

    Object.assign(participant, updatedData);

    const nowIso = new Date().toISOString();
    await dataStore.updateDocument("participants", dataStore.participants, participant.id, {
      name: participant.name,
      mobile: participant.mobile,
      organization: participant.organization,
      city: participant.city,
      profilePhoto: participant.profilePhoto,
      updatedAt: nowIso,
    });

    AuthService.memoryParticipants.set(participant.id, participant);
    logger.info(
      `Participant profile updated in Firestore for user ${userId} [${participant.participantId}]`,
    );

    return {
      id: participant.id,
      userId: participant.userId,
      participantId: participant.participantId,
      name: participant.name,
      mobile: participant.mobile,
      organization: participant.organization,
      city: participant.city,
      profilePhoto: participant.profilePhoto,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    };
  }

  /**
   * Fetches games for which the participant is registered.
   */
  public async GET_PARTICIPANT_GAMES(userId: string): Promise<IParticipantGameItem[]> {
    const participant = await this.FIND_PARTICIPANT_BY_USER_ID(userId);
    if (!participant) {
      throw new NotFoundError(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const registrations = await dataStore.registrations.find(
      (r) => r.participantId === participant.id,
    );

    const resultList: IParticipantGameItem[] = [];
    for (const reg of registrations) {
      const game = await dataStore.games.getById(reg.gameId);
      if (game) {
        const result = await dataStore.results.findOne(
          (res) => res.gameId === game.id && res.participantId === participant.id,
        );
        resultList.push({
          gameId: game.id,
          title: game.title,
          gameType: game.gameType,
          status: game.status,
          registeredAt: new Date(reg.registeredAt),
          score: result?.score ?? 0,
          maxScore: game.maxScore,
        });
      }
    }

    return resultList;
  }

  /**
   * Computes score summary and ranking metrics for participant.
   */
  public async GET_PARTICIPANT_SCORES(
    userId: string,
  ): Promise<IParticipantScoreSummary> {
    const participant = await this.FIND_PARTICIPANT_BY_USER_ID(userId);
    if (!participant) {
      throw new NotFoundError(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const results = await dataStore.results.find(
      (r) => r.participantId === participant.id,
    );

    let totalScore = 0;
    const gameScores = [];
    for (const res of results) {
      totalScore += res.score;
      const game = await dataStore.games.getById(res.gameId);
      gameScores.push({
        gameId: res.gameId,
        gameTitle: game?.title || "DevFest Challenge",
        score: res.score,
        maxScore: game?.maxScore || 100,
        verified: res.verified,
        updatedAt: new Date(res.updatedAt),
      });
    }

    return {
      participantId: participant.participantId,
      name: participant.name,
      totalScore,
      gamesPlayed: results.length,
      scores: gameScores,
    };
  }

  /**
   * Retrieves active team affiliation for the participant.
   */
  public async GET_PARTICIPANT_TEAM(
    userId: string,
  ): Promise<IParticipantTeamDetails | null> {
    const participant = await this.FIND_PARTICIPANT_BY_USER_ID(userId);
    if (!participant) {
      throw new NotFoundError(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const memberRecord = await dataStore.teamMembers.findOne(
      (m) => m.participantId === participant.id,
    );
    if (!memberRecord) {
      return null;
    }

    const team = await dataStore.teams.getById(memberRecord.teamId);
    if (!team) return null;

    const allMembers = await dataStore.teamMembers.find((m) => m.teamId === team.id);

    return {
      id: team.id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      leaderId: team.leaderId,
      isLeader: team.leaderId === participant.id,
      createdAt: new Date(team.createdAt),
      members: allMembers.map((m) => ({
        id: m.id,
        participantId: m.participantId,
        name: "Member",
        joinedAt: new Date(m.joinedAt),
        isLeader: m.participantId === team.leaderId,
      })),
    };
  }

  /**
   * Update participant status (ACTIVE/DISABLED) - Super Admin only.
   */
  public async UPDATE_PARTICIPANT_STATUS(
    participantId: string,
    status: "ACTIVE" | "DISABLED",
  ): Promise<void> {
    const participant = await this.FIND_PARTICIPANT_BY_ID(participantId);
    if (!participant) {
      throw new NotFoundError(ParticipantConstants.MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    const userStatus = status === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
    const nowIso = new Date().toISOString();

    await dataStore.updateDocument("participants", dataStore.participants, participant.id, {
      status,
      updatedAt: nowIso,
    });
    await dataStore.updateDocument("users", dataStore.users, participant.userId, {
      status: userStatus,
      updatedAt: nowIso,
    });

    participant.updatedAt = new Date(nowIso);
    AuthService.memoryParticipants.set(participant.id, participant);

    logger.info(`Participant ${participantId} status updated to ${status}`);
  }
}
