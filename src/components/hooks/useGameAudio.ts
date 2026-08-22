"use client";

import { useCallback, useEffect, useState } from "react";
import { preloadAssets, soundCache } from "~/utils/optimizations";
import type { ScreenId } from "../gameTypes";

function playCachedSound(path: string, volume: number, muted: boolean) {
  const audio = soundCache.get(path);
  if (!audio || muted) return;
  audio.currentTime = 0;
  audio.volume = volume;
  void audio.play();
}

function startLoop(path: string, volume: number) {
  const audio = soundCache.get(path);
  if (!audio) return null;
  audio.volume = volume;
  audio.loop = true;
  if (audio.paused) {
    void audio.play().catch((error: Error) => {
      console.error(`${path} failed to play:`, error);
    });
  }
  return audio;
}

function stopAudio(path: string) {
  const audio = soundCache.get(path);
  if (!audio || audio.paused) return;
  audio.pause();
  audio.currentTime = 0;
}

export function useGameAudio(screen: ScreenId) {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("isMuted") === "true";
  });

  useEffect(() => {
    localStorage.setItem("isMuted", isMuted.toString());
    Array.from(soundCache.values()).forEach((audio) => {
      if (!audio) return;
      audio.muted = isMuted;
      if (isMuted) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, [isMuted, screen]);

  useEffect(() => {
    preloadAssets(isMuted);
    // Only kick off preload once; mute changes are applied by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (screen === "leaderboard") {
      stopAudio("/sounds/gameplay.mp3");
      startLoop("/sounds/boomsback.mp3", 0.5);
      return () => stopAudio("/sounds/boomsback.mp3");
    }

    if (screen === "tutorial" || screen === "game") {
      stopAudio("/sounds/boomsback.mp3");
      const gameplay = startLoop("/sounds/gameplay.mp3", 0.2);
      return () => {
        if (screen === "menu" || screen === "leaderboard") {
          if (gameplay) {
            gameplay.pause();
            gameplay.currentTime = 0;
          }
        }
      };
    }
  }, [screen]);

  useEffect(() => {
    return () => {
      Array.from(soundCache.values()).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  const playWarSound = useCallback(() => {
    playCachedSound("/sounds/war.mp3", 0.75, isMuted);
  }, [isMuted]);

  const playNukeSound = useCallback(() => {
    playCachedSound("/sounds/nuke.mp3", 0.75, isMuted);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { isMuted, toggleMute, playWarSound, playNukeSound };
}
