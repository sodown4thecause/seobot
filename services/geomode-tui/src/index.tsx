#!/usr/bin/env node
import React from 'react'
import { render, Text } from 'ink'
import { DigestView } from './digest-view.js'
import { fetchDigest, loadGeoTuiConfig } from './config.js'

async function main() {
  const config = loadGeoTuiConfig()
  const payload = await fetchDigest(config)
  render(<DigestView payload={payload} />)
}

main().catch(error => {
  render(<Text color="red">{error instanceof Error ? error.message : 'Failed to start geo-tui'}</Text>)
  process.exitCode = 1
})
