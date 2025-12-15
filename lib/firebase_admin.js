let admin;
try {
  admin = require("firebase-admin");
} catch (e) {
  admin = null;
}

let serviceAccount = null;
let adminDB = {};

// Only initialize on server-side
if (typeof window === 'undefined' && admin) {
  try {
    const serviceAccountString = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEYS ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEYS;

    if (serviceAccountString) {
      serviceAccount = JSON.parse(serviceAccountString);

      // Fix private key newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    }
  } catch (error) {
    console.error("Failed to parse firebase service account keys:", error.message);
  }

  if (admin.apps.length === 0 && serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminDB = admin.firestore();
    } catch (error) {
      console.error("Failed to initialize firebase admin:", error.message);
    }
  } else if (admin.apps.length > 0) {
    adminDB = admin.firestore();
  }
}

// Export with fallbacks
export { admin };
export { adminDB };
