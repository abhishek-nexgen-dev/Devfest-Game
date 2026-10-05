/**
 * GDG Ranchi DevFest 2026 - Certificate Constants
 */

export class CertificateConstants {
  public static readonly PREFIX = "GDG-RN-2026-CERT";

  public static readonly ROUTES = {
    ROOT: "/",
    VERIFY: "/verify/:hash",
    GENERATE: "/generate",
    MY_CERTIFICATE: "/my-certificate",
  } as const;

  public static readonly MESSAGES = {
    ISSUED: "Certificate generated and issued successfully.",
    VERIFIED: "Certificate verified successfully.",
    NOT_FOUND: "Certificate not found or invalid verification hash.",
    ALREADY_ISSUED: "Certificate already issued for this participant.",
  } as const;
}

export const CertificateConstant = CertificateConstants;
