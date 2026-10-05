// src/core/database/auth.ts

import { getAuth, Auth } from "firebase-admin/auth";
import firebase from "../../infrastructure/firebase/firebase.utils";

/**
 * Firebase Admin Authentication instance
 */
const auth: Auth = getAuth(firebase);
export default auth;
