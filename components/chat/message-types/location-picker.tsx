'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface LocationPickerProps {
  onSubmit: (location: { country: string; region?: string; city?: string }) => void
}

export function LocationPicker({ onSubmit }: LocationPickerProps) {
  const [location, setLocation] = useState({
    country: '',
    region: '',
    city: '',
  })

  const handleSubmit = () => {
    if (location.country.trim()) {
      onSubmit(location)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Country *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={location.country}
              onChange={(e) => setLocation({ ...location, country: e.target.value })}
              placeholder="United States"
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Region/State</label>
          <Input
            value={location.region}
            onChange={(e) => setLocation({ ...location, region: e.target.value })}
            placeholder="California"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">City (Optional)</label>
          <Input
            value={location.city}
            onChange={(e) => setLocation({ ...location, city: e.target.value })}
            placeholder="San Francisco"
          />
        </div>
      </div>
      
      <Button onClick={handleSubmit} disabled={!location.country.trim()} className="w-full">
        Continue
      </Button>
    </Card>
  )
}

