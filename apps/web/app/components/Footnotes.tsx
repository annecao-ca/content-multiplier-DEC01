'use client'

import React, { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import { Copy, ExternalLink, Check } from 'lucide-react'

interface Source {
  id: number
  title: string
  url?: string
  snippet: string
}

interface FootnotesProps {
  sources: Source[]
  className?: string
}

export function Footnotes({ sources, className = '' }: FootnotesProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const handleCopyUrl = async (url: string, id: number) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <div className={`mt-8 ${className}`} id="footnotes-section">
      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          📚 Nguồn tham khảo
        </h3>
        
        <Accordion type="single" collapsible className="w-full">
          {sources.map((source) => (
            <AccordionItem
              key={source.id}
              value={`source-${source.id}`}
              id={`footnote-${source.id}`}
              className="transition-colors border-slate-700 data-[state=open]:bg-slate-800/50"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-start text-left space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-semibold flex-shrink-0 ring-1 ring-indigo-500/30">
                    {source.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-100">
                      {source.title}
                    </p>
                    {source.url && (
                      <p className="text-sm text-indigo-400 truncate mt-1">
                        {source.url}
                      </p>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="pl-9 space-y-3">
                  {/* Retrieved snippet */}
                  <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4">
                    <p className="text-sm text-slate-300 italic">
                      "{source.snippet}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {source.url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyUrl(source.url!, source.id)}
                          className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                        >
                          {copiedId === source.id ? (
                            <>
                              <Check className="mr-1 h-3 w-3 text-green-400" />
                              Đã copy
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 h-3 w-3" />
                              Copy URL
                            </>
                          )}
                        </Button>
                        
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Mở link
                          </Button>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Add CSS for highlight animation */}
      <style jsx>{`
        :global(.highlight-footnote) {
          animation: highlight 2s ease;
        }
        
        @keyframes highlight {
          0%, 100% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(99, 102, 241, 0.2);
          }
        }
      `}</style>
    </div>
  )
}










