// src/App.js
import React, { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./components/Dashboard";
import SplashScreen from "./components/SplashScreen";

// Google Fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Only show splash once per session
const hasSeenSplash = sessionStorage.getItem("splashSeen");

export default function App() {
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);

  function handleSplashDone() {
    sessionStorage.setItem("splashSeen", "true");
    setShowSplash(false);
  }

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Dashboard />
    </AuthProvider>
  );
}
