export enum GameStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

export interface GameType {
  id: number;
  game_name: string;
  description: string | null;
  max_score: number;
  registrations: number;
  submissions: number;
  start_time: Date;
  end_time: Date;
  status: GameStatus;
  created_at?: Date;
  updated_at?: Date;
}
