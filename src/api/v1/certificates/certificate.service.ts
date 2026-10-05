import { dataStore } from "../../../core/database/firestore.store";
import { logger } from "../../../core/logger/logger";
import { NotFoundError } from "../../../shared/errors/AppError";
import { CertificateConstants } from "./certificate.constants";
import { IIssueCertificateDto, ICertificateRecord } from "./certificate.types";
import crypto from "crypto";

/**
 * GDG Ranchi DevFest 2026 - Certificate Service
 * Cloud Firestore document-driven issuance and cryptographic hash verification.
 */
export class CertificateService {
  public async ISSUE_CERTIFICATE(
    dto: IIssueCertificateDto,
  ): Promise<ICertificateRecord> {
    const certId = "cert-" + Date.now();
    const certificateNo = `GDGR-CERT-${Date.now().toString().slice(-6)}`;
    const verificationHash = crypto
      .createHash("sha256")
      .update(`${dto.participantId}-${certificateNo}-${Date.now()}`)
      .digest("hex");
    const nowIso = new Date().toISOString();

    const certDoc = {
      id: certId,
      certificateNo,
      participantId: dto.participantId,
      participantName: dto.participantName,
      verificationHash,
      certificateUrl: dto.certificateUrl || null,
      issuedAt: nowIso,
    };

    await dataStore.saveDocument("certificates", dataStore.certificates, certDoc);
    logger.info(
      `Certificate issued in Firestore: ${certificateNo} for ${dto.participantName}`,
    );

    return {
      id: certDoc.id,
      certificateNo: certDoc.certificateNo,
      participantId: certDoc.participantId,
      participantName: certDoc.participantName,
      verificationHash: certDoc.verificationHash,
      certificateUrl: certDoc.certificateUrl,
      issuedAt: new Date(certDoc.issuedAt),
    };
  }

  public async VERIFY_CERTIFICATE(hash: string): Promise<ICertificateRecord> {
    const cert = await dataStore.certificates.findOne(
      (c) => c.verificationHash === hash,
    );
    if (!cert) {
      throw new NotFoundError(CertificateConstants.MESSAGES.CERTIFICATE_NOT_FOUND);
    }

    return {
      id: cert.id,
      certificateNo: cert.certificateNo,
      participantId: cert.participantId,
      participantName: cert.participantName,
      verificationHash: cert.verificationHash,
      certificateUrl: cert.certificateUrl,
      issuedAt: new Date(cert.issuedAt),
    };
  }

  public async GET_MY_CERTIFICATES(
    participantId: string,
  ): Promise<ICertificateRecord[]> {
    const certs = await dataStore.certificates.find(
      (c) => c.participantId === participantId,
    );
    return certs.map((c) => ({
      id: c.id,
      certificateNo: c.certificateNo,
      participantId: c.participantId,
      participantName: c.participantName,
      verificationHash: c.verificationHash,
      certificateUrl: c.certificateUrl,
      issuedAt: new Date(c.issuedAt),
    }));
  }
}
