import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDJ8K87_pU3nMOsb4trPeww6tRvRudbbz0",
  authDomain: "instarelax-205d3.firebaseapp.com",
  projectId: "instarelax-205d3",
  storageBucket: "instarelax-205d3.firebasestorage.app",
  messagingSenderId: "571629274463",
  appId: "1:571629274463:web:bc85aed4b332d30acc62ea",
  measurementId: "G-2VH3L4CWRJ",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Lazily initialize analytics only in the browser when supported
void (async () => {
  if (typeof window !== "undefined") {
    try {
      const supported = await isAnalyticsSupported();
      if (supported) {
        getAnalytics(app);
      }
    } catch {
      // ignore analytics init errors in unsupported environments
    }
  }
})();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;


