'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploadProps {
  agentId: string
  tableName: string
  onUploadSuccess?: () => void
}

export function DocumentUpload({ agentId, tableName, onUploadSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    if (acceptedFiles.length > 0 && !title) {
      // Auto-set title from first file name
      setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md', '.markdown'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!files.length || !title) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and select a file',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('title', title)
      formData.append('tableName', tableName)

      const response = await fetch('/api/admin/knowledge/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      toast({
        title: 'Success!',
        description: 'Document uploaded and processed successfully',
      })

      // Reset form
      setTitle('')
      setFiles([])
      onUploadSuccess?.()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Document Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., SEO Best Practices 2024"
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* File Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-white bg-white/5' : 'border-white/20 hover:border-white/40'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-gray-400" />
          {files.length > 0 ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">{files[0].name}</p>
              <p className="text-xs text-gray-400">
                {(files[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-white">
                {isDragActive ? 'Drop file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-xs text-gray-400">
                or click to browse (PDF, Markdown, TXT, DOCX)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={uploading || !files.length || !title}
        className="w-full bg-white text-black hover:bg-gray-200"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>
    </div>
  )
}

