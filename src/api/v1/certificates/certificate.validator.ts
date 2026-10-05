import { z } from "zod";
import { validateBody, validateParams } from "../../../middleware/validate.middleware";

/**
 * GDG Ranchi DevFest 2026 - Certificate Validators
 */
export class CertificateValidator {
  public static readonly ISSUE_SCHEMA = z.object({
    participantId: z.string().min(1, "Participant ID is required"),
    participantName: z.string().min(2, "Participant name is required"),
    certificateUrl: z.string().url().optional(),
  });

  public static readonly VERIFY_PARAMS_SCHEMA = z.object({
    hash: z.string().min(6, "Verification code or hash is required"),
  });

  public static readonly VALIDATE_ISSUE = validateBody(CertificateValidator.ISSUE_SCHEMA);
  public static readonly VALIDATE_VERIFY = validateParams(
    CertificateValidator.VERIFY_PARAMS_SCHEMA,
  );
}
