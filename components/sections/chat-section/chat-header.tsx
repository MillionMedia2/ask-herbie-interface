"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ChatHeaderProps {
  onSidebarToggle: () => void;
}

export default function ChatHeader({ onSidebarToggle }: ChatHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onSidebarToggle}
              className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} className="text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/herbi_logo.png"
                alt="Herbie Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain dark:invert"
              />
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                Herbie
              </h1>
            </div>
          </div>
          <div className="w-10 h-10" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onSidebarToggle}
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/herbi_logo.png"
              alt="Herbie Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain dark:invert"
            />
            <h1 className="text-lg sm:text-xl font-semibold">
              <span className="text-primary inline-block animate-letter-fade-in">
                Ask{" "}
              </span>
              <span
                className="text-primary inline-block animate-letter-fade-in"
                style={{ animationDelay: "0.2s", opacity: 0 }}
              >
                Herbie
              </span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 hover:bg-primary/10 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun size={20} className="text-foreground" />
          ) : (
            <Moon size={20} className="text-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}
