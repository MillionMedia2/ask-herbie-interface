"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function HomePage() {
  const router = useRouter();

  router.push("/chat");

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
