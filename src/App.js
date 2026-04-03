// src/App.js
import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";

// Google Fonts
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

function AppInner() {
  const { currentUser } = useAuth();
  // Dashboard is always visible — login is only needed to ADD orders
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
