"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ExplosionParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  rotation: number;
  blurAmount: number;
  shape: 'circle' | 'triangle' | 'square';
}

interface ShockwaveProps {
  delay: number;
}

const Shockwave: React.FC<ShockwaveProps> = ({ delay }) => {
  // Using a simple declarative animation approach instead of animation controls
  return (
    <motion.div
      className="shockwave"
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 10, opacity: 0 }}
      transition={{
        duration: 3,
        ease: "easeOut",
        delay: delay / 1000, // Convert from ms to seconds
        repeatDelay: Math.random() * 8 + 3, // Random delay between repetitions
        repeat: Infinity
      }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,165,0,0.4) 70%, rgba(255,0,0,0) 100%)',
        transform: 'translate(-50%, -50%)',
        zIndex: 0
      }}
    />
  );
};

const ExplosionBackground: React.FC = () => {
  // Generate a fixed set of particles and shockwaves
  // This avoids complex state management and timing issues
  const generateStaticParticles = () => {
    const particles: ExplosionParticle[] = [];
    const colors = [
      '#ff4500', '#ff8c00', '#ffd700', '#ffff00', '#ff6347', 
      '#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00'
    ];
    
    // Create multiple batches of particles with different delays
    // This creates the illusion of multiple explosions over time
    for (let batch = 0; batch < 3; batch++) {
      for (let i = 0; i < 8; i++) {
        particles.push({
          id: batch * 100 + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 80 + 20,
          duration: Math.random() * 4 + 3,
          delay: batch * 10 + Math.random() * 3, // Different delay per batch
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          blurAmount: Math.random() * 15 + 5,
          shape: 'circle'
        });
      }
    }
    
    return particles;
  };
  
  // Static particles and delays for shockwaves
  const particles = generateStaticParticles();
  const shockwaveDelays = [0, 10000, 20000];
  
  // No complex state management or animation controls needed
  
  return (
    <div className="explosion-background">
      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="explosion-particle"
          initial={{
            opacity: 0,
            scale: 0,
            x: `50%`,
            y: `50%`,
            rotate: 0,
            backgroundColor: particle.color
          }}
          animate={{
            opacity: [0, 0.9, 0],
            scale: [0, 1, 0.5],
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            rotate: [0, particle.rotation],
            backgroundColor: particle.color
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 8 + 2
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            filter: `blur(${particle.blurAmount}px)`,
            zIndex: 0,
            borderRadius: '50%' // All particles are circles
          }}
        />
      ))}
      
      {/* Shockwaves */}
      {shockwaveDelays.map((delay: number, index: number) => (
        <Shockwave key={index} delay={delay} />
      ))}
    </div>
  );
};

export default ExplosionBackground;
