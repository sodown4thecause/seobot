
const fs = require('fs');

// Mock data based on the curl output structure
const mockItem = {
    type: "backlink",
    domain_from: "avgo6568.dpgames.org",
    url_from: "https://avgo6568.dpgames.org/?cid=hmh",
    url_from_https: true,
    domain_to: "example.com",
    url_to: "https://example.com/",
    // ... lots of other fields ...
    title: "Some very long title about something relevant to the page",
    anchor: "some anchor text",
    first_seen: "2025-12-28 23:49:26 +00:00"
};

// Create 200 items
const items = Array(200).fill(mockItem);

const mockResponse = {
    version: "0.1.20260116",
    tasks: [{
        result: [{
            items: items
        }]
    }]
};

// Paste the function from the codebase (simplified for the test)
function normalizeBacklinksResponse(domain, data) {
  const normalizeUrlHostname = (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) return null
    try { return new URL(value).hostname || null } catch { return null }
  }

  const normalizeBacklinkItem = (item) => {
    const sourceUrl = item?.url_from || item?.source_url;
    const targetUrl = item?.url_to || item?.target_url;
    const anchorText = item?.anchor || item?.anchor_text;
    const referringDomain = item?.domain_from || normalizeUrlHostname(sourceUrl);
    
    // THE PROBLEM: Including raw item
    return { sourceUrl, targetUrl, anchorText, referringDomain, raw: item }
  }

  const extractBacklinksArray = (payload) => {
    // Simplified extraction logic for test
    if (payload.tasks?.[0]?.result?.[0]?.items) return payload.tasks[0].result[0].items;
    return [];
  }

  const backlinksRaw = extractBacklinksArray(data)
  const backlinks = backlinksRaw.map(normalizeBacklinkItem)
  const backlinksCount = backlinks.length
  
  const exampleBacklinks = backlinks.slice(0, 10).map((b) => ({
    sourceUrl: b.sourceUrl,
    targetUrl: b.targetUrl,
    anchorText: b.anchorText,
    referringDomain: b.referringDomain,
  }))

  return {
    status: 'success',
    domain,
    backlinks,
    backlinksCount,
    exampleBacklinks,
    ...(data && typeof data === 'object' ? data : { raw: data }),
  }
}

const result = normalizeBacklinksResponse('example.com', mockResponse);
const jsonString = JSON.stringify(result);

console.log('Number of items:', result.backlinks.length);
console.log('Size of input JSON:', JSON.stringify(mockResponse).length / 1024, 'KB');
console.log('Size of output JSON:', jsonString.length / 1024, 'KB');
