import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatDate = (iso: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
};

export const formatDateShort = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(date);
};

export const formatDateDay = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
};
