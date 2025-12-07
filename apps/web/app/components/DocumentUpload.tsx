'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Upload, File, X } from 'lucide-react'

interface DocumentUploadProps {
  onUpload?: (file: File) => Promise<void>
  trigger?: React.ReactNode
  accept?: string
}

export function DocumentUpload({ 
  onUpload, 
  trigger,
  accept = '.pdf,.doc,.docx,.txt'
}: DocumentUploadProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !onUpload) return

    setUploading(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onUpload(file)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      // Close dialog after successful upload
      setTimeout(() => {
        setOpen(false)
        setFile(null)
        setProgress(0)
      }, 500)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Upload Document</DialogTitle>
          <DialogDescription className="text-slate-400">
            Tải lên tài liệu để sử dụng làm nguồn tham khảo cho RAG system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleChange}
              disabled={uploading}
            />

            {!file ? (
              <div className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-slate-500" />
                <p className="mt-2 text-sm font-medium text-slate-200">
                  Click to upload hoặc kéo thả file vào đây
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  PDF, DOC, DOCX, TXT (max. 10MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <File className="h-8 w-8 text-indigo-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-200 truncate max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="p-1 hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Đang upload...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-800" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={uploading}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f97316] hover:opacity-90"
          >
            {uploading ? 'Đang tải...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}













