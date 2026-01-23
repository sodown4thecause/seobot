
const fs = require('fs');
const path = require('path');

const modulesToCheck = [
  '@tailwindcss/typography',
  'next-sanity',
  'sanity',
  '@sanity/image-url',
  'sanity/structure',
  'next-sanity/studio'
];

console.log('--- Checking Module Resolution ---');

modulesToCheck.forEach(mod => {
  try {
    const resolvedPath = require.resolve(mod);
    console.log(`✅ [SUCCESS] Resolved '${mod}' at: ${resolvedPath}`);
  } catch (err) {
    console.error(`❌ [FAILED] Could not resolve '${mod}': ${err.message}`);
  }
});
