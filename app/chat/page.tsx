import type { Metadata } from "next"
import ChatSection from "@/components/sections/chat-section/chat-section"

export const metadata: Metadata = {
  title: "Ask Herbie - Natural Remedy AI Companion",
  description:
    "Chat with Herbie, your AI natural remedy companion. Get personalized recommendations, product information, and customer support for natural health solutions.",
  keywords: ["AI", "natural remedies", "health", "herbal", "wellness"],
  openGraph: {
    title: "Ask Herbie Interface",
    description: "Your AI natural remedy companion",
    type: "website",
  },
}

export default function ChatPage() {
  return <ChatSection />
}
