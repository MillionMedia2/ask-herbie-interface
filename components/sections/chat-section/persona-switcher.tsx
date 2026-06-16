"use client";

import { Sparkles, Leaf, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PERSONAS,
  type PersonaId,
} from "@/constants/personas";
import { cn } from "@/lib/utils";

interface PersonaSwitcherProps {
  persona: PersonaId;
  onPersonaChange: (persona: PersonaId) => void;
  disabled?: boolean;
}

const PERSONA_ICONS: Record<PersonaId, typeof Leaf> = {
  default: Leaf,
  aisha: Sparkles,
};

const menuItemClassName = cn(
  "group flex cursor-pointer flex-col items-start gap-0.5 rounded-md py-2.5",
  "focus:bg-muted focus:text-foreground",
  "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
);

export default function PersonaSwitcher({
  persona,
  onPersonaChange,
  disabled = false,
}: PersonaSwitcherProps) {
  const active = PERSONAS[persona];
  const ActiveIcon = PERSONA_ICONS[persona];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={
            disabled
              ? "Wait for the response to finish before switching companion"
              : "Switch AI companion"
          }
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
            "border-border bg-background hover:bg-muted/80",
            "data-[state=open]:bg-muted data-[state=open]:border-primary/40",
            "disabled:opacity-50 disabled:pointer-events-none",
            persona === "aisha" &&
              "border-amber-500/30 data-[state=open]:border-amber-500/50",
          )}
          aria-label="Switch AI companion"
        >
          <ActiveIcon
            size={16}
            className={cn(
              "shrink-0",
              persona === "aisha"
                ? "text-amber-600 dark:text-amber-400"
                : "text-primary",
            )}
          />
          <span className="text-foreground">{active.shortLabel}</span>
          <ChevronDown
            size={14}
            className="shrink-0 text-muted-foreground"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Choose companion
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(PERSONAS) as PersonaId[]).map((id) => {
          const config = PERSONAS[id];
          const Icon = PERSONA_ICONS[id];
          const isActive = id === persona;

          return (
            <DropdownMenuItem
              key={id}
              onClick={() => onPersonaChange(id)}
              className={cn(
                menuItemClassName,
                isActive && "bg-primary/5 focus:bg-muted data-[highlighted]:bg-muted",
              )}
            >
              <div className="flex w-full items-center gap-2">
                <Icon
                  size={16}
                  className={cn(
                    "shrink-0",
                    id === "aisha"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-primary",
                  )}
                />
                <span className="font-medium text-foreground">{config.label}</span>
                {isActive && (
                  <Check
                    size={14}
                    className="ml-auto shrink-0 text-primary"
                    aria-hidden
                  />
                )}
              </div>
              <span
                className={cn(
                  "pl-6 text-xs leading-snug",
                  "text-muted-foreground",
                  "group-focus:text-muted-foreground",
                  "group-data-[highlighted]:text-foreground/70",
                )}
              >
                {config.tagline}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
