"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  repeatDelay: number;
}

const COLORS = ["#ff4500", "#ff8c00", "#ffd700", "#ff6347", "#ff3300"];

function createParticles(): Particle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    size: 28 + Math.random() * 24,
    duration: 3 + Math.random() * 2,
    delay: i * 0.35,
    color: COLORS[i % COLORS.length]!,
    repeatDelay: 4 + (i % 3),
  }));
}

function ExplosionBackground({ isActive = true }: { isActive?: boolean }) {
  const particles = useMemo(createParticles, []);

  if (!isActive) return null;

  return (
    <div className="explosion-background pointer-events-none" aria-hidden>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="explosion-particle"
          initial={{ opacity: 0, scale: 0.4, x: "50%", y: "50%" }}
          animate={{
            opacity: [0, 0.55, 0],
            scale: [0.4, 1, 0.6],
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: particle.repeatDelay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            background: particle.color,
            opacity: 0.5,
            zIndex: 0,
          }}
        />
      ))}
    </div>
  );
}

export default memo(ExplosionBackground);
