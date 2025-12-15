export const admin = require("firebase-admin");

let serviceAccount = null;

try {
  serviceAccount = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS
    ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS)
    : null;
} catch (error) {
  console.error("Failed to parse firebase service account keys:", error);
}

if (admin.apps.length === 0 && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize firebase admin:", error);
  }
}

export const adminDB = admin.apps.length > 0 ? admin.firestore() : {};
