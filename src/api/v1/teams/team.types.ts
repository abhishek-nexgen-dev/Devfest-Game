/**
 * GDG Ranchi DevFest 2026 - Team Types & Interfaces
 */

export interface ICreateTeamDto {
  teamName: string;
}

export interface IJoinTeamDto {
  teamCode: string;
}

export interface ITeamMemberInfo {
  id: string;
  participantId: string;
  name: string;
  joinedAt: Date | string;
  isLeader: boolean;
}

export interface ITeamDetails {
  id: string;
  teamName: string;
  teamCode: string;
  leaderId: string;
  createdAt: Date | string;
  members: ITeamMemberInfo[];
  totalScore?: number;
}
