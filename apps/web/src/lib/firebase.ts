import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Solicita permiso de notificaciones push y devuelve el token FCM del dispositivo.
 * @intervention ARCH-20260423-01
 * Retorna null si el navegador no soporta FCM o el usuario deniega el permiso.
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Notificaciones push no soportadas en este navegador.");
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      ),
    });

    if (!token) {
      console.warn("[FCM] No se pudo obtener el token — permiso denegado.");
      return null;
    }

    console.log("[FCM] Token obtenido:", token.slice(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("[FCM] Error obteniendo token:", error);
    return null;
  }
}
