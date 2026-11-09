import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhUm-e6PbVyNRtUatYZKFBVMb-YWc7MIc",
  authDomain: "educa360-dev.firebaseapp.com",
  databaseURL: "https://educa360-dev-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "educa360-dev",
  storageBucket: "educa360-dev.firebasestorage.app",
  messagingSenderId: "101009225415",
  appId: "1:101009225415:web:4b5c267dfeb857b8d9b0e2",
  measurementId: "G-SXDWJ0WQBT"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

if (process.env.NODE_ENV === "development") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (e) {
    // Evita errores si ya estaban conectados
  }
}

export { db, app, auth };