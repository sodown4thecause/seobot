'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface Document {
  id: string
  title: string
  file_type: string
  created_at: string
  metadata?: any
}

interface DocumentListProps {
  agentId: string
  tableName: string
  refreshKey?: number
}

export function DocumentList({ agentId, tableName, refreshKey }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [tableName, refreshKey])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/admin/knowledge/list?tableName=${tableName}`)
      if (!response.ok) throw new Error('Failed to fetch documents')
      
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    setDeleting(documentId)
    try {
      const response = await fetch('/api/admin/knowledge/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, tableName }),
      })

      if (!response.ok) throw new Error('Failed to delete document')

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      })

      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No documents uploaded yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload your first document to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">{doc.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {doc.file_type.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(doc.id)}
            disabled={deleting === doc.id}
            className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
          >
            {deleting === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}

