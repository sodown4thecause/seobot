/**
 * Rytr API Discovery Script
 * 
 * Discovers available use cases and their input context requirements
 * Run with: npx tsx scripts/discover-rytr-use-cases.ts
 */

import { serverEnv } from '@/lib/config/env';

const RYTR_API_BASE = 'https://api.rytr.me/v1';

async function discoverRytrUseCases() {
  console.log('🔍 Discovering Rytr API use cases...\n');
  
  try {
    // Get all use cases
    console.log('📋 Fetching use cases list...');
    const useCasesResponse = await fetch(`${RYTR_API_BASE}/use-cases`, {
      headers: {
        'Authentication': `Bearer ${serverEnv.RYTR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!useCasesResponse.ok) {
      const error = await useCasesResponse.text();
      throw new Error(`Failed to fetch use cases: ${useCasesResponse.status} - ${error}`);
    }
    
    const useCases = await useCasesResponse.json();
    console.log(`✓ Found ${useCases.length} use cases\n`);
    console.log('Available use cases:', JSON.stringify(useCases, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Find humanize use case
    const humanizeCase = useCases.find((uc: any) => 
      uc.name?.toLowerCase().includes('humanize') || 
      uc.id?.toLowerCase().includes('humanize')
    );
    
    if (humanizeCase) {
      console.log('🎯 Found humanize use case:', humanizeCase);
      console.log('\n' + '='.repeat(80) + '\n');
      
      // Get detailed info about humanize use case
      console.log('📖 Fetching detailed information...');
      const detailResponse = await fetch(`${RYTR_API_BASE}/use-cases/${humanizeCase.id}`, {
        headers: {
          'Authentication': `Bearer ${serverEnv.RYTR_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!detailResponse.ok) {
        const error = await detailResponse.text();
        console.warn(`Failed to fetch details: ${detailResponse.status} - ${error}`);
      } else {
        const detail = await detailResponse.json();
        console.log('✓ Humanize use case details:');
        console.log(JSON.stringify(detail, null, 2));
      }
    } else {
      console.warn('⚠️  No "humanize" use case found');
      console.log('Available use case names:', useCases.map((uc: any) => uc.name || uc.id));
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('✅ Discovery complete!');
    
  } catch (error) {
    console.error('❌ Discovery failed:', error);
    throw error;
  }
}

// Run the discovery
discoverRytrUseCases().catch(console.error);

