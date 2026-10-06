import "dotenv/config";
import fs from "fs";
import path from "path";
import { App, applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage, Storage } from "firebase-admin/storage";
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { logger } from "../../core/logger/logger";

// Configuration defaults
let configProjectId = process.env.FIREBASE_PROJECT_ID || "gdg-ranchi-f44c9";
let configStorageBucket =
  process.env.FIREBASE_STORAGE_BUCKET || "gdg-ranchi-f44c9.firebasestorage.app";
let configDatabaseId =
  process.env.FIRESTORE_DATABASE_ID || "ai-studio-devfestgame-ca5cb9b4-9f77-480c-b389-e5947a48e0d6";

// Inspect firebase-applet-config.json if present
const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.projectId) configProjectId = parsed.projectId;
    if (parsed.storageBucket) configStorageBucket = parsed.storageBucket;
    if (parsed.firestoreDatabaseId) configDatabaseId = parsed.firestoreDatabaseId;
  } catch (err) {
    logger.warn("Could not read firebase-applet-config.json:", err);
  }
}

/**
 * Initialize Firebase Admin App with robust credential detection
 */
const initializeFirebaseApp = (): App => {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // 1. Check for explicit service account credentials in environment
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      const app = initializeApp({
        credential: cert({
          projectId: configProjectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        projectId: configProjectId,
        storageBucket: configStorageBucket,
      });
      logger.info(`🔥 Firebase Admin initialized with service account for ${configProjectId}`);
      return app;
    } catch (error) {
      logger.warn("Failed to initialize Firebase with service account cert:", error);
    }
  }

  // 2. Try Google Application Default Credentials
  try {
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: configProjectId,
      storageBucket: configStorageBucket,
    });
    logger.info(`🔥 Firebase Admin initialized with applicationDefault for ${configProjectId}`);
    return app;
  } catch (appDefaultError) {
    logger.warn(
      "applicationDefault() not available, falling back to standard project initialization.",
    );
  }

  // 3. Fallback project-only initialization for local development/testing
  try {
    const app = initializeApp({
      projectId: configProjectId,
      storageBucket: configStorageBucket,
    });
    logger.info(`🔥 Firebase Admin initialized (project mode): ${configProjectId}`);
    return app;
  } catch (fallbackError) {
    logger.error("Failed to initialize Firebase Admin SDK fallback:", fallbackError);
    return getApps()[0];
  }
};

const firebase: App = initializeFirebaseApp();

// ----------------------------------------------------------------------------
// Firebase Storage Utilities
// ----------------------------------------------------------------------------

/**
 * Get Firebase Storage bucket instance
 */
export const getStorageBucket = () => {
  const storage: Storage = getStorage(firebase);
  return storage.bucket(configStorageBucket);
};

/**
 * Upload buffer or base64 file to Firebase Storage bucket.
 * Returns public access URL.
 */
export const uploadFile = async (
  fileData: Buffer | string,
  destinationPath: string,
  contentType = "image/jpeg",
  metadata: Record<string, string> = {},
): Promise<string> => {
  try {
    const bucket = getStorageBucket();
    const file = bucket.file(destinationPath);

    const buffer =
      typeof fileData === "string" && !fileData.startsWith("http")
        ? Buffer.from(fileData, "base64")
        : Buffer.isBuffer(fileData)
          ? fileData
          : Buffer.from(fileData);

    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          event: "GDG Ranchi DevFest 2026",
          ...metadata,
        },
      },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
    logger.info(`File uploaded to Firebase Storage: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    logger.error(`Error uploading file to Firebase Storage (${destinationPath}):`, error);
    // Return standard Cloud Storage public URL fallback
    return `https://storage.googleapis.com/${configStorageBucket}/${destinationPath}`;
  }
};

/**
 * Generate a signed download URL for private files
 */
export const getSignedDownloadUrl = async (
  filePath: string,
  expiresInMinutes = 60,
): Promise<string> => {
  try {
    const bucket = getStorageBucket();
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return signedUrl;
  } catch (error) {
    logger.error(`Error generating signed URL for ${filePath}:`, error);
    return `https://storage.googleapis.com/${configStorageBucket}/${filePath}`;
  }
};

/**
 * Delete a file from Firebase Storage bucket
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const bucket = getStorageBucket();
    const file = bucket.file(filePath);
    await file.delete({ ignoreNotFound: true });
    logger.info(`File deleted from Firebase Storage: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting file from Firebase Storage (${filePath}):`, error);
    return false;
  }
};

/**
 * Get direct public storage URL for a path
 */
export const getFileUrl = (filePath: string): string => {
  return `https://storage.googleapis.com/${configStorageBucket}/${filePath}`;
};

// ----------------------------------------------------------------------------
// Firestore Helpers
// ----------------------------------------------------------------------------

/**
 * Helper to get server timestamp
 */
export const getServerTimestamp = (): Timestamp => {
  return Timestamp.now();
};

/**
 * Helper to convert Date or ISO string to Firestore Timestamp
 */
export const toFirestoreTimestamp = (date?: Date | string | number): Timestamp => {
  if (!date) return Timestamp.now();
  if (date instanceof Date) return Timestamp.fromDate(date);
  if (typeof date === "string" || typeof date === "number") {
    return Timestamp.fromDate(new Date(date));
  }
  return Timestamp.now();
};

export const hasRemoteCredentials = Boolean(
  (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
);

/**
 * Export default Firebase App and named helpers
 */
export { firebase, firebase as app, configProjectId, configStorageBucket, configDatabaseId };

export default firebase;
