'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Database, Loader2, RefreshCw } from 'lucide-react'
import { SearchConsoleConnectButton } from '@/components/search-console/connect-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchConsoleProperty {
  siteUrl: string
  permissionLevel?: string
}

interface PropertiesResponse {
  ok: boolean
  properties?: SearchConsoleProperty[]
  error?: string
}

interface SnapshotResponse {
  ok: boolean
  rowCount?: number
  chunkCount?: number
  documentIds?: string[]
  error?: string
}

interface SnapshotStatus {
  kind: 'success' | 'error'
  title: string
  message: string
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getDefaultDateRange() {
  const end = new Date()
  end.setDate(end.getDate() - 3)

  const start = new Date(end)
  start.setDate(start.getDate() - 90)

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

export function SearchConsolePropertyImporter() {
  const defaultDates = useMemo(() => getDefaultDateRange(), [])
  const [properties, setProperties] = useState<SearchConsoleProperty[]>([])
  const [selectedSiteUrl, setSelectedSiteUrl] = useState('')
  const [startDate, setStartDate] = useState(defaultDates.startDate)
  const [endDate, setEndDate] = useState(defaultDates.endDate)
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<SnapshotStatus | null>(null)

  async function loadProperties() {
    setLoadingProperties(true)
    setStatus(null)

    try {
      const response = await fetch('/api/search-console/properties')
      const data = await response.json() as PropertiesResponse

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to load Search Console properties')
      }

      const nextProperties = data.properties ?? []
      setProperties(nextProperties)

      if (!selectedSiteUrl && nextProperties[0]?.siteUrl) {
        setSelectedSiteUrl(nextProperties[0].siteUrl)
      }

      if (nextProperties.length === 0) {
        setStatus({
          kind: 'error',
          title: 'No verified properties found',
          message: 'Google returned no Search Console properties for this account.',
        })
      }
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'Search Console is not connected',
        message: error instanceof Error ? error.message : 'Reconnect Google with Search Console access.',
      })
    } finally {
      setLoadingProperties(false)
    }
  }

  async function importSnapshot() {
    if (!selectedSiteUrl) {
      setStatus({
        kind: 'error',
        title: 'Choose a property',
        message: 'Select a Search Console property before importing performance data.',
      })
      return
    }

    setImporting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/search-console/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: selectedSiteUrl,
          startDate,
          endDate,
          rowLimit: 250,
        }),
      })
      const data = await response.json() as SnapshotResponse

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to import Search Console snapshot')
      }

      setStatus({
        kind: 'success',
        title: 'Search Console context imported',
        message: `${data.rowCount ?? 0} query-page rows were added to private SEO memory across ${data.chunkCount ?? 0} chunks.`,
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'Unable to import Search Console data.',
      })
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    void loadProperties()
  }, [])

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Search Console Context
            </CardTitle>
            <CardDescription>
              Import first-party query and page performance into private SEO memory for more specific chat answers.
            </CardDescription>
          </div>
          <SearchConsoleConnectButton />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="search-console-property">Property</Label>
            <Select
              value={selectedSiteUrl}
              onValueChange={setSelectedSiteUrl}
              disabled={loadingProperties || properties.length === 0}
            >
              <SelectTrigger id="search-console-property">
                <SelectValue placeholder={loadingProperties ? 'Loading properties...' : 'Choose property'} />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.siteUrl} value={property.siteUrl}>
                    {property.siteUrl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-console-start">Start</Label>
            <Input
              id="search-console-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              max={endDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-console-end">End</Label>
            <Input
              id="search-console-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              min={startDate}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={loadProperties}
              disabled={loadingProperties}
              aria-label="Refresh Search Console properties"
            >
              {loadingProperties ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            </Button>
            <Button
              type="button"
              onClick={importSnapshot}
              disabled={importing || loadingProperties || !selectedSiteUrl}
            >
              {importing ? <Loader2 className="animate-spin" /> : <Database />}
              Import
            </Button>
          </div>
        </div>

        {properties.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Imported snapshots are scoped to your account and used only as private context in SEO mode.
          </p>
        )}

        {status && (
          <Alert variant={status.kind === 'error' ? 'destructive' : 'default'}>
            {status.kind === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle>{status.title}</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
