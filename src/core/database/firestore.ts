// src/database/firestore.ts

import { getFirestore } from "firebase-admin/firestore";
import firebase from "../../infrastructure/firebase/firebase.utils";

export const db = getFirestore(firebase);
