/**
 * GDG Ranchi DevFest 2026 - Submission Types
 */

export interface ICreateSubmissionDto {
  gameId: string;
  submissionData: string;
}

export interface ISubmissionRecord {
  id: string;
  gameId: string;
  participantId?: string | null;
  teamId?: string | null;
  submissionData?: string | null;
  submittedAt: Date | string;
}
