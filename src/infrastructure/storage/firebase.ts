import { getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { app, configStorageBucket } from "../../core/database/firestore";
import { logger } from "../../core/logger/logger";

/**
 * Upload participant avatar / photo to Firebase Storage bucket.
 * Returns public access URL or fallback placeholder URL.
 */
export const uploadParticipantPhotoToFirebase = async (
  fileBuffer: Buffer | string,
  participantId: string,
  contentType = "image/jpeg",
): Promise<string> => {
  try {
    const apps = getApps();
    if (apps.length === 0 || !configStorageBucket) {
      logger.info(
        `Firebase storage not active. Returning placeholder photo for participant: ${participantId}`,
      );
      return typeof fileBuffer === "string" && fileBuffer.startsWith("http")
        ? fileBuffer
        : `https://storage.googleapis.com/devfest-placeholder/${participantId}.jpg`;
    }

    try {
      const storage = getStorage(app);
      const bucket = storage.bucket(configStorageBucket);
      const destination = `participants/${participantId}-${Date.now()}.jpg`;
      const file = bucket.file(destination);

      const buffer =
        typeof fileBuffer === "string" ? Buffer.from(fileBuffer, "base64") : fileBuffer;

      await file.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            participantId,
            event: "GDG Ranchi DevFest 2026",
          },
        },
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
      logger.info(`Participant photo uploaded to Firebase Storage: ${publicUrl}`);
      return publicUrl;
    } catch (storageErr) {
      logger.warn("Storage upload using fallback photo URL:", storageErr);
      return typeof fileBuffer === "string" && fileBuffer.startsWith("http")
        ? fileBuffer
        : `https://storage.googleapis.com/${configStorageBucket}/participants/${participantId}.jpg`;
    }
  } catch (error) {
    logger.error("Error in uploadParticipantPhotoToFirebase:", error);
    return `https://storage.googleapis.com/devfest-placeholder/${participantId}.jpg`;
  }
};
