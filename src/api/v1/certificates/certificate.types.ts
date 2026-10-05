/**
 * GDG Ranchi DevFest 2026 - Certificate Types
 */

export interface IIssueCertificateDto {
  participantId: string;
  participantName: string;
  certificateUrl?: string;
}

export interface ICertificateRecord {
  id: string;
  certificateNo: string;
  participantId: string;
  participantName: string;
  verificationHash: string;
  certificateUrl?: string | null;
  issuedAt: Date | string;
}
