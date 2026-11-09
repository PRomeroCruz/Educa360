import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto de Firebase
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

// Evita inicializar la app múltiples veces en desarrollo
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

if (process.env.NODE_ENV === "development" && !auth.emulatorConfig) {
  // El puerto por defecto del emulador de Auth de Firebase suele ser el 9099
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

export { db, app, auth };