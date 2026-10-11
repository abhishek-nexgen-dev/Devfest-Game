export interface IParticipantGameItem {
  game_id: number;
  game_name?: string;
  Total_game_point?: number;
  isCompleted?: boolean;

}

export interface IParticipantDoc {
  id: number | string;
  ticket_id: string;
  name: string;
  email: string;
  mobile_number: string;
  social_link: string;
  profile_image: string | null;
  location: string;
  github_url: string | null;
  primary_language: string[];
  games: IParticipantGameItem[];
  total_points: number;
  is_certificate_claim: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}


export interface JoinGameType {
  ticket_id: string;
  email: string;
  game_id: number;
}