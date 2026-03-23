import { createDirectus, rest, staticToken } from '@directus/sdk';

const BACKEND_URL = process.env.DIRECTUS_URL || "http://localhost:8055/";
const TOKEN = process.env.DIRECTUS_TOKEN;

if (!BACKEND_URL) {
  throw new Error('DIRECTUS_URL environment variable is required');
}

// Create Directus client
let client = createDirectus(BACKEND_URL);

// Add authentication if token is available
if (TOKEN) {
  client = client.with(staticToken(TOKEN));
}

// Add REST client with caching disabled for fresh data
client = client.with(rest({
  onRequest: (options: RequestInit) => ({ 
    ...options, 
    cache: 'no-store'
  }),
}));

export default client;

// Helper function to get asset URL
export function getAssetUrl(assetId: string, options?: { width?: number; height?: number; fit?: string }): string | null {
  if (!assetId) return null;
  
  let url = `${BACKEND_URL}assets/${assetId}`;
  
  if (options) {
    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.fit) params.append('fit', options.fit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  return url;
}
