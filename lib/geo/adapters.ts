import { runOneGlansePrompt } from './oneglanse-client'
import type { GeoEngine, GeoEngineAdapter, GeoEngineAdapterInput, GeoEngineResult } from './types'

class OneGlanseFacadeAdapter implements GeoEngineAdapter {
  constructor(private readonly engine: GeoEngine) {}
  async runPrompt(input: GeoEngineAdapterInput): Promise<GeoEngineResult> {
    return runOneGlansePrompt(this.engine, input)
  }
}

export function getGeoEngineAdapter(engine: GeoEngine): GeoEngineAdapter {
  return new OneGlanseFacadeAdapter(engine)
}
