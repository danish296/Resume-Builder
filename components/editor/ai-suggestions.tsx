import React from "react"

interface AISuggestionsProps {
  sourceText: string
  onApply: (text: string) => void
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ sourceText, onApply }) => {
  // For now, return a simple component since AI functionality isn't implemented
  return (
    <div className="text-sm text-muted-foreground">
      AI suggestions coming soon...
    </div>
  )
}

export default AISuggestions
