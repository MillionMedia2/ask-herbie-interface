"use client"

interface ChatSuggestionsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

export default function ChatSuggestions({ suggestions, onSuggestionClick }: ChatSuggestionsProps) {
  return (
    <div className="border-t border-border bg-primary/15 px-6 py-6">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Suggestions</h3>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full rounded-full border border-primary/40 bg-primary/10 px-4 py-3 text-left text-sm text-foreground transition-all hover:border-primary/60 hover:bg-primary/20"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
