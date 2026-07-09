import { runAisaGeoPrompt } from './aisa-adapter'
import type { GeoEngine, GeoEngineAdapter, GeoEngineAdapterInput, GeoEngineResult } from './types'

class GeoEngineAdapterImpl implements GeoEngineAdapter {
  constructor(private readonly engine: GeoEngine) {}

  async runPrompt(input: GeoEngineAdapterInput, userId?: string): Promise<GeoEngineResult> {
    return runAisaGeoPrompt(this.engine, input, userId)
  }
}

export function getGeoEngineAdapter(engine: GeoEngine): GeoEngineAdapter {
  return new GeoEngineAdapterImpl(engine)
}
