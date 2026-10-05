// src/core/database/firestore.ts

import {
  getFirestore,
  Firestore,
  CollectionReference,
  DocumentData,
  Timestamp,
  FieldValue,
} from "firebase-admin/firestore";
import firebase, { configDatabaseId } from "../../infrastructure/firebase/firebase.utils";
import { COLLECTIONS } from "../../constants/collections";

/**
 * Cloud Firestore Enterprise instance (Native Mode with MongoDB Compatibility).
 * Configured with enterprise database ID: ai-studio-devfestgame-ca5cb9b4-9f77-480c-b389-e5947a48e0d6.
 */
export const db: Firestore = getFirestore(firebase, configDatabaseId);

/**
 * Helper to obtain a strongly-typed collection reference.
 */
export const getCollection = <T = DocumentData>(collectionName: string): CollectionReference<T> => {
  return db.collection(collectionName) as CollectionReference<T>;
};

export { COLLECTIONS, Timestamp, FieldValue, configDatabaseId };
export default db;

