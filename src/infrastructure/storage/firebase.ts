// src/core/database/storage.ts

import { getStorage, Storage } from "firebase-admin/storage";
import firebase, {
  configStorageBucket,
  uploadFile,
  deleteFile,
  getSignedDownloadUrl,
  getFileUrl,
  getStorageBucket,
} from "../../infrastructure/firebase/firebase.utils";

/**
 * Firebase Cloud Storage instance for managing participant photos, certificates, and event assets.
 */
export const storage: Storage = getStorage(firebase);

/**
 * Default Firebase Storage Bucket
 */
export const bucket = storage.bucket(configStorageBucket);

export {
  configStorageBucket,
  uploadFile,
  deleteFile,
  getSignedDownloadUrl,
  getFileUrl,
  getStorageBucket,
};

export default storage;
