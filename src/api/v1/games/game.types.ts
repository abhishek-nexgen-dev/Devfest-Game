/**
 * GDG Ranchi DevFest 2026 - Game Types
 */

export type GameType = "INDIVIDUAL" | "TEAM";
export type GameStatus = "UPCOMING" | "ACTIVE" | "CLOSED";

export interface ICreateGameDto {
  title: string;
  description?: string;
  gameType: GameType;
  maxScore?: number;
}

export interface IUpdateGameDto {
  title?: string;
  description?: string;
  gameType?: GameType;
  maxScore?: number;
  status?: GameStatus;
}

export interface IGameDetails {
  id: string;
  title: string;
  description?: string | null;
  gameType: GameType;
  status: GameStatus;
  maxScore: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
