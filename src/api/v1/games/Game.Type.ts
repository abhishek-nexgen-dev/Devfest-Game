export enum GameStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  COMPLETED = "COMPLETED",
}

export enum GameTypeEnum {
  ON_BOOTH = "ON_BOOTH",
  ON_STAGE = "ON_STAGE",
  QUIZ_ARENA = "QUIZ_ARENA",
  HACK_SPRINT = "HACK_SPRINT",
  OPEN_CHALLENGE = "OPEN_CHALLENGE",
}

export enum GameTrackEnum {
  CONFERENCE = "Conference",
  BEGINNER_TRACK = "Beginner Track",
  FLAGSHIP_DEV_TRACK = "Flagship Dev Track",
  ALL_TRACK = "All Track",
}

export interface GameType {
  id: number | string;
  game_name: string;
  description: string | null;
  max_score: number;
  registrations: number;
  submissions: number;
  start_time: Date | string;
  end_time: Date | string;
  status: GameStatus | string;
  game_type: GameTypeEnum | string;
  is_completed: boolean;
  tagline?: string | null;
  track?: GameTrackEnum | string | null;
  venue?: string | null;
  rules?: string | null;
  created_by?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}
