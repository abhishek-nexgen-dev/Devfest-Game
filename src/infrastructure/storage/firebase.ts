import * as admin from "firebase-admin";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../../core/logger/logger";

let isFirebaseInitialized = false;

export const initFirebase = () => {
  if (isFirebaseInitialized || admin.apps.length > 0) {
    return;
  }

  try {
    if (
      env_Constant.FIREBASE_PROJECT_ID &&
      env_Constant.FIREBASE_CLIENT_EMAIL &&
      env_Constant.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env_Constant.FIREBASE_PROJECT_ID,
          clientEmail: env_Constant.FIREBASE_CLIENT_EMAIL,
          privateKey: env_Constant.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket: env_Constant.FIREBASE_STORAGE_BUCKET,
      });
      isFirebaseInitialized = true;
      logger.info("🔥 Firebase Admin SDK initialized for Firebase Storage.");
    } else {
      logger.warn(
        "⚠️ Firebase credentials not configured in .env. Storage uploads will use fallback URL.",
      );
    }
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
  }
};

// Initialize on module load
initFirebase();

/**
 * Upload participant avatar / photo to Firebase Storage bucket.
 * Returns public access URL or fallback.
 */
export const uploadParticipantPhotoToFirebase = async (
  fileBuffer: Buffer | string,
  participantId: string,
  contentType = "image/jpeg",
): Promise<string> => {
  try {
    if (!admin.apps.length || !env_Constant.FIREBASE_STORAGE_BUCKET) {
      logger.info(
        `Firebase storage not active. Returning placeholder photo for participant: ${participantId}`,
      );
      return typeof fileBuffer === "string"
        ? fileBuffer
        : `https://storage.googleapis.com/devfest-placeholder/${participantId}.jpg`;
    }

    const bucket = admin.storage().bucket(env_Constant.FIREBASE_STORAGE_BUCKET);
    const destination = `participants/${participantId}-${Date.now()}.jpg`;
    const file = bucket.file(destination);

    const buffer = typeof fileBuffer === "string" ? Buffer.from(fileBuffer, "base64") : fileBuffer;

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
  } catch (error) {
    logger.error("Error uploading to Firebase Storage:", error);
    throw error;
  }
};
