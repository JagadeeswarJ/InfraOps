import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "../utils/env.util.js";
import { getStorage } from "firebase-admin/storage";

const serviceAccountKey: ServiceAccount = {
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  privateKey: env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: env.GOOGLE_CLOUD_CLIENT_EMAIL,
};

const app = initializeApp({
  credential: cert(serviceAccountKey),
  storageBucket: env.STORAGE_BUCKET,
});

const db = getFirestore(app);
const storage = getStorage(app);


if (db && storage) {
  console.log("Firebase initialized successfully");
} else {
  throw new Error("Failed to initialise firebase");
}

export { db, storage };
