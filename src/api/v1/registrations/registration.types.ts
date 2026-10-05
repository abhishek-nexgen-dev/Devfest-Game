/**
 * GDG Ranchi DevFest 2026 - Registration Types
 */

export interface IRegisterGameDto {
  gameId: string;
}

export interface IRegistrationRecord {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  registeredAt: Date | string;
}
