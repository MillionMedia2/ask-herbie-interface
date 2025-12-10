"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Menu, Download, FileText, FileCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { exportChatAsTXT, exportChatAsPDF } from "@/lib/exportChat";
import { IMessage } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  onSidebarToggle: () => void;
  messages?: IMessage[];
  conversationTitle?: string;
}

export default function ChatHeader({
  onSidebarToggle,
  messages = [],
  conversationTitle = "Chat",
}: ChatHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState(false);

  const hasMessages = messages.length > 0;

  const handleExportTXT = () => {
    if (!hasMessages) return;
    exportChatAsTXT(messages, conversationTitle);
  };

  const handleExportPDF = async () => {
    if (!hasMessages) return;
    setExporting(true);
    try {
      await exportChatAsPDF(messages, conversationTitle);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export as PDF. Please try TXT export instead.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4 shrink-0">
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
    <header className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4 shrink-0">
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
        <div className="flex items-center gap-2">
          {hasMessages && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-lg p-2 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  aria-label="Export chat"
                  disabled={exporting}
                >
                  <Download size={20} className="text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleExportTXT}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Export as TXT</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="cursor-pointer"
                  disabled={exporting}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  <span>{exporting ? "Generating..." : "Export as PDF"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
      </div>
    </header>
  );
}
