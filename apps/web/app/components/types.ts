/**
 * Shared types for RAG components
 */

export default interface Source {
  id: number
  title: string
  snippet: string
  url?: string
}

export interface Document {
  id: string
  title: string
  url?: string
  uploadDate: Date
}





















