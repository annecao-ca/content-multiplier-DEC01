'use client'

import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { Badge } from './ui/badge'

interface Source {
  id: number
  title: string
  snippet: string
  url?: string
}

interface InlineCitationProps {
  citationNumber: number
  source?: Source
  onCitationClick?: (citationNumber: number) => void
}

export function InlineCitation({
  citationNumber,
  source,
  onCitationClick,
}: InlineCitationProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onCitationClick) {
      onCitationClick(citationNumber)
    } else {
      // Default behavior: scroll to footnote
      const footnoteElement = document.getElementById(`footnote-${citationNumber}`)
      if (footnoteElement) {
        footnoteElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Highlight animation
        footnoteElement.classList.add('highlight-footnote')
        setTimeout(() => {
          footnoteElement.classList.remove('highlight-footnote')
        }, 2000)
      }
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-colors ml-0.5 mr-0.5 text-indigo-700 border-indigo-300"
            onClick={handleClick}
          >
            [{citationNumber}]
          </Badge>
        </TooltipTrigger>
        {source && (
          <TooltipContent
            side="top"
            className="max-w-xs p-3"
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm text-white">
                {source.title}
              </p>
              <p className="text-xs text-gray-200 line-clamp-3">
                {source.snippet}
              </p>
              {source.url && (
                <p className="text-xs text-gray-300 truncate">
                  {source.url}
                </p>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

interface ParsedContentProps {
  content: string
  sources: Source[]
  onCitationClick?: (citationNumber: number) => void
}

/**
 * Component to parse text with citations and replace [1], [2] etc with InlineCitation components
 */
export function ParsedContentWithCitations({
  content,
  sources,
  onCitationClick,
}: ParsedContentProps) {
  // Parse content and replace [n] with citation components
  const parseContent = () => {
    const parts = []
    let lastIndex = 0
    
    // Regex to match [1], [2], etc
    const citationRegex = /\[(\d+)\]/g
    let match

    while ((match = citationRegex.exec(content)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        )
      }

      // Add the citation component
      const citationNumber = parseInt(match[1], 10)
      const source = sources.find(s => s.id === citationNumber)
      
      parts.push(
        <InlineCitation
          key={`citation-${match.index}`}
          citationNumber={citationNumber}
          source={source}
          onCitationClick={onCitationClick}
        />
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      )
    }

    return parts
  }

  return <div className="inline leading-relaxed space-y-2">{parseContent()}</div>
}







