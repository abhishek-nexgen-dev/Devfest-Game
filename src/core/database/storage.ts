import { getStorage } from "firebase-admin/storage";
import firebase from "../../infrastructure/firebase/firebase.utils";

export const storage = getStorage(firebase);
