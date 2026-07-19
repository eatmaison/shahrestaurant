"use client";

import { motion, useReducedMotion } from "motion/react";

const EMBERS = [8, 18, 31, 44, 57, 69, 82, 92];
const SPICE_TRAILS = [12, 28, 47, 64, 79];

export function Atmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="site-atmosphere" aria-hidden>
      <div className="site-atmosphere__mesh" />
      <div className="site-atmosphere__grain" />
      {!reduceMotion && (
        <>
          <div className="site-atmosphere__embers">
            {EMBERS.map((left, index) => (
              <motion.span
                key={left}
                className="site-atmosphere__ember"
                style={{ left: `${left}%` }}
                animate={{ y: [28, -110], x: [0, index % 2 ? 18 : -14], opacity: [0, 0.8, 0], scale: [0.65, 1, 0.82] }}
                transition={{ duration: 5.4 + (index % 4) * 0.7, repeat: Infinity, delay: index * 0.55, ease: "easeOut" }}
              />
            ))}
          </div>
          <div className="site-atmosphere__trails">
            {SPICE_TRAILS.map((left, index) => (
              <motion.span
                key={left}
                className="site-atmosphere__trail"
                style={{ left: `${left}%` }}
                animate={{ y: [0, -38, 0], opacity: [0.08, 0.2, 0.08] }}
                transition={{ duration: 7 + index, repeat: Infinity, delay: index * 0.9, ease: "easeInOut" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}