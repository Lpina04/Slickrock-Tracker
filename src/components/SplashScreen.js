// src/components/SplashScreen.js
import React, { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "hold" | "out"

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("out"), 2000);
    const doneTimer = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{ ...styles.overlay, opacity: phase === "out" ? 0 : 1 }}>
      <div style={{ ...styles.logo, transform: phase === "in" ? "scale(1)" : "scale(1.03)" }}>
        <img
          src="/Diseno_sin_titulo_2.webp"
          alt="Slickrock Concrete"
          style={styles.splashImg}
        />
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "#0f0f0f",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
    transition: "opacity 0.8s ease",
  },
  logo: {
    display: "flex", flexDirection: "column", alignItems: "center",
    transition: "transform 2s ease",
  },
  splashImg: {
    width: "80vw", maxWidth: "320px",
    objectFit: "contain",
  },
};
