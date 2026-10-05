import { COLLECTIONS } from "../../../constants/collections";
import { db } from "../../../core/database/firestore";
import { IUserDoc, IParticipantDoc } from "./Auth.type";
import { CollectionReference } from "firebase-admin/firestore";

export const UsersCollection = db.collection(COLLECTIONS.USERS) as CollectionReference<IUserDoc>;

export const ParticipantsCollection = db.collection(
  COLLECTIONS.PARTICIPANTS,
) as CollectionReference<IParticipantDoc>;

export const SignUpCollection = db.collection(
  COLLECTIONS.SIGN_UP,
) as CollectionReference<any>;

export const ActivityLogsCollection = db.collection(
  COLLECTIONS.ACTIVITY_LOGS,
) as CollectionReference<any>;

// Alias for backwards compatibility
export const SignUpSchema = SignUpCollection;
export default SignUpSchema;

