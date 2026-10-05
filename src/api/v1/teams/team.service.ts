import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../../shared/errors/AppError";
import { TeamConstants } from "./team.constants";
import { TeamUtils } from "./team.utils";
import { ICreateTeamDto, ITeamDetails } from "./team.types";

/**
 * GDG Ranchi DevFest 2026 - Team Service
 * Cloud Firestore document-driven team management and member affiliations.
 */
export class TeamService {
  public async CREATE_TEAM(
    leaderParticipantId: string,
    dto: ICreateTeamDto,
  ): Promise<ITeamDetails> {
    const existingMembership = await dataStore.teamMembers.findOne(
      (m) => m.participantId === leaderParticipantId,
    );
    if (existingMembership) {
      throw new ConflictError(TeamConstants.MESSAGES.ALREADY_IN_TEAM);
    }

    const teamCode = TeamUtils.GENERATE_TEAM_CODE();
    const teamId = "team-" + Date.now();
    const nowIso = new Date().toISOString();

    const teamDoc = {
      id: teamId,
      teamName: dto.teamName.trim(),
      teamCode,
      leaderId: leaderParticipantId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await dataStore.saveDocument("teams", dataStore.teams, teamDoc);

    const memberDoc = {
      id: "mem-" + Date.now(),
      teamId,
      participantId: leaderParticipantId,
      joinedAt: nowIso,
    };
    await dataStore.saveDocument("team_members", dataStore.teamMembers, memberDoc);

    logger.info(`Team created in Firestore: ${teamDoc.teamName} [${teamDoc.teamCode}]`);

    return {
      id: teamDoc.id,
      teamName: teamDoc.teamName,
      teamCode: teamDoc.teamCode,
      leaderId: teamDoc.leaderId,
      createdAt: new Date(teamDoc.createdAt),
      members: [
        {
          id: memberDoc.id,
          participantId: leaderParticipantId,
          name: "Team Leader",
          joinedAt: new Date(memberDoc.joinedAt),
          isLeader: true,
        },
      ],
    };
  }

  public async JOIN_TEAM(
    participantId: string,
    teamCode: string,
  ): Promise<ITeamDetails> {
    const existingMembership = await dataStore.teamMembers.findOne(
      (m) => m.participantId === participantId,
    );
    if (existingMembership) {
      throw new ConflictError(TeamConstants.MESSAGES.ALREADY_IN_TEAM);
    }

    const code = teamCode.trim().toUpperCase();
    const team = await dataStore.teams.findOne((t) => t.teamCode === code);
    if (!team) {
      throw new NotFoundError(TeamConstants.MESSAGES.INVALID_TEAM_CODE);
    }

    const members = await dataStore.teamMembers.find((m) => m.teamId === team.id);
    if (members.length >= TeamConstants.RULES.MAX_MEMBERS) {
      throw new BadRequestError(TeamConstants.MESSAGES.TEAM_FULL);
    }

    const nowIso = new Date().toISOString();
    const memberDoc = {
      id: "mem-" + Date.now(),
      teamId: team.id,
      participantId,
      joinedAt: nowIso,
    };
    await dataStore.saveDocument("team_members", dataStore.teamMembers, memberDoc);

    members.push(memberDoc);

    return {
      id: team.id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      leaderId: team.leaderId,
      createdAt: new Date(team.createdAt),
      members: members.map((m) => ({
        id: m.id,
        participantId: m.participantId,
        name: "Member",
        joinedAt: new Date(m.joinedAt),
        isLeader: m.participantId === team.leaderId,
      })),
    };
  }

  public async GET_TEAM_BY_ID(teamId: string): Promise<ITeamDetails | null> {
    const team = await dataStore.teams.getById(teamId);
    if (!team) return null;

    const members = await dataStore.teamMembers.find((m) => m.teamId === team.id);

    return {
      id: team.id,
      teamName: team.teamName,
      teamCode: team.teamCode,
      leaderId: team.leaderId,
      createdAt: new Date(team.createdAt),
      members: members.map((m) => ({
        id: m.id,
        participantId: m.participantId,
        name: "Member",
        joinedAt: new Date(m.joinedAt),
        isLeader: m.participantId === team.leaderId,
      })),
    };
  }

  public async GET_PARTICIPANT_TEAM(
    participantId: string,
  ): Promise<ITeamDetails | null> {
    const member = await dataStore.teamMembers.findOne(
      (m) => m.participantId === participantId,
    );
    if (!member) return null;

    return this.GET_TEAM_BY_ID(member.teamId);
  }

  public async LIST_TEAMS(): Promise<ITeamDetails[]> {
    const teams = await dataStore.teams.getAll();
    const result: ITeamDetails[] = [];

    for (const team of teams) {
      const members = await dataStore.teamMembers.find((m) => m.teamId === team.id);
      result.push({
        id: team.id,
        teamName: team.teamName,
        teamCode: team.teamCode,
        leaderId: team.leaderId,
        createdAt: new Date(team.createdAt),
        members: members.map((m) => ({
          id: m.id,
          participantId: m.participantId,
          name: "Member",
          joinedAt: new Date(m.joinedAt),
          isLeader: m.participantId === team.leaderId,
        })),
      });
    }

    return result;
  }

  public async LEAVE_TEAM(participantId: string): Promise<void> {
    const member = await dataStore.teamMembers.findOne(
      (m) => m.participantId === participantId,
    );
    if (!member) {
      throw new NotFoundError(TeamConstants.MESSAGES.NOT_IN_TEAM);
    }

    const team = await dataStore.teams.getById(member.teamId);
    if (team && team.leaderId === participantId) {
      throw new BadRequestError(TeamConstants.MESSAGES.LEADER_CANNOT_LEAVE);
    }

    await dataStore.deleteDocument("team_members", dataStore.teamMembers, member.id);
  }
}
