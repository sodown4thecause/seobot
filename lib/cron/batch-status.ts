type BatchResult = {
  status: string
}

export function isBatchSuccessful(results: BatchResult[]) {
  return results.every((result) => result.status !== 'failed')
}

export function getBatchHttpStatus(results: BatchResult[]): 200 | 500 {
  return isBatchSuccessful(results) ? 200 : 500
}
