"use client";

import { useEffect, useRef, useState } from "react";

interface UseTypewriterProps {
  text: string;
  speed?: number; // ms per character
  enabled?: boolean;
}

export function useTypewriter({
  text,
  speed = 5,
  enabled = true,
}: UseTypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!enabled || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Reset state for new animation
    setDisplayedText("");
    setIsComplete(false);
    let currentIndex = 0;

    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutRef.current = setTimeout(typeNextCharacter, speed);
      } else {
        setIsComplete(true);
      }
    };

    // Start typing
    timeoutRef.current = setTimeout(typeNextCharacter, speed);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
}
