'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

interface UrlInputProps {
  onSubmit: (url: string) => void
  placeholder?: string
}

export function UrlInput({ onSubmit, placeholder = 'https://yourwebsite.com' }: UrlInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <Input
          id="url-input"
          name="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
        />
      </div>
      <Button type="submit" disabled={!url.trim()} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 w-full font-medium">
        Analyze Website
      </Button>
    </form>
  )
}
