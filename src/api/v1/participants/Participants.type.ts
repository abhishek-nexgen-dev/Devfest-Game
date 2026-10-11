export interface IParticipantGameItem {
  game_id: number;
  is_completed: boolean;
  points: number;
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
