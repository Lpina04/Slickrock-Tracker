// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP INSTRUCTIONS:
//   1. Go to https://console.firebase.google.com
//   2. Create a new project (e.g. "slickrock-tracker")
//   3. Add a Web App to the project
//   4. Copy your firebaseConfig values below
//   5. In Firebase Console → Firestore Database → Create database (production mode)
//   6. In Firebase Console → Authentication → Sign-in method → Enable Email/Password
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfSZSStNzmDvNEPeuanys7RCmW1jaWrN0",
  authDomain: "slickrock-tracker.firebaseapp.com",
  projectId: "slickrock-tracker",
  storageBucket: "slickrock-tracker.firebasestorage.app",
  messagingSenderId: "415730497798",
  appId: "1:415730497798:web:1cb4c900f4cec25ae58687",
  measurementId: "G-JD0LXKFBHJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
