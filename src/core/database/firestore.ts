import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../logger/logger";
import fs from "fs";
import path from "path";

let configProjectId = env_Constant.FIREBASE_PROJECT_ID || "gdg-ranchi-f44c9";
let configStorageBucket =
  env_Constant.FIREBASE_STORAGE_BUCKET || "gdg-ranchi-f44c9.firebasestorage.app";
let configDatabaseId =
  env_Constant.FIRESTORE_DATABASE_ID ||
  "ai-studio-devfestgame-ca5cb9b4-9f77-480c-b389-e5947a48e0d6";

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

let app: App;
const existingApps = getApps();

if (existingApps.length === 0) {
  try {
    if (
      env_Constant.FIREBASE_PROJECT_ID &&
      env_Constant.FIREBASE_CLIENT_EMAIL &&
      env_Constant.FIREBASE_PRIVATE_KEY
    ) {
      app = initializeApp({
        credential: cert({
          projectId: env_Constant.FIREBASE_PROJECT_ID,
          clientEmail: env_Constant.FIREBASE_CLIENT_EMAIL,
          privateKey: env_Constant.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        projectId: configProjectId,
        storageBucket: configStorageBucket,
      });
      logger.info("🔥 Firebase Admin initialized with certificate credentials.");
    } else {
      app = initializeApp({
        projectId: configProjectId,
        storageBucket: configStorageBucket,
      });
      logger.info(`🔥 Firebase Admin initialized for project: ${configProjectId}`);
    }
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin SDK:", error);
    app = initializeApp({ projectId: configProjectId }, "fallback");
  }
} else {
  app = existingApps[0];
}

export const firestore: Firestore = getFirestore(app, configDatabaseId);

export { app, configProjectId, configDatabaseId, configStorageBucket };
