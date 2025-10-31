import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/config/env';
import { domainMetrics, serpAnalysis } from '@/lib/api/dataforseo-service';

export const runtime = 'edge';

interface CompetitorSnapshot {
  domain: string;
  keywords: Array<{
    keyword: string;
    position: number;
    previous_position?: number;
    url: string;
  }>;
  domain_rank: number;
  backlinks_count: number;
  referring_domains: number;
  organic_traffic_est: number;
  snapshot_date: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get auth user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active competitors for user's business profiles
    const { data: profiles, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id);

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: 'No business profiles found' },
        { status: 404 }
      );
    }

    const profileIds = profiles.map(p => p.id);

    // Get competitors to monitor
    const { data: competitors, error: competitorError } = await supabase
      .from('competitors')
      .select('id, business_profile_id, domain, tracked_keywords')
      .in('business_profile_id', profileIds);

    if (competitorError || !competitors || competitors.length === 0) {
      return NextResponse.json(
        { success: true, data: { message: 'No competitors to monitor', snapshots: [] } }
      );
    }

    const snapshots: CompetitorSnapshot[] = [];
    const alerts: Array<{
      type: string;
      domain: string;
      keyword?: string;
      change: number;
      severity: string;
    }> = [];

    // Monitor each competitor
    for (const competitor of competitors) {
      try {
        // Get domain metrics
        const metricsResult = await domainMetrics({ domain: competitor.domain });
        
        let domainRank = 0;
        let backlinksCount = 0;
        let referringDomains = 0;
        let organicTrafficEst = 0;

        if (metricsResult.success && metricsResult.data.tasks?.[0]?.result?.[0]) {
          const metrics = metricsResult.data.tasks[0].result[0];
          domainRank = metrics.rank || 0;
          backlinksCount = metrics.backlinks || 0;
          referringDomains = metrics.referring_domains || 0;
          organicTrafficEst = 0; // Not available in current API
        }

        // Track keyword rankings
        const keywordData: CompetitorSnapshot['keywords'] = [];
        const trackedKeywords = competitor.tracked_keywords || [];

        if (trackedKeywords.length > 0) {
          for (const keyword of trackedKeywords.slice(0, 10)) {  // Limit to 10 keywords per competitor
            const serpResult = await serpAnalysis({ keyword, location_code: 2840 });

            if (serpResult.success && serpResult.data.tasks?.[0]?.result?.[0]?.items) {
              const items = serpResult.data.tasks[0].result[0].items;
              const competitorResult = items.find(
                (r: any) => r.url?.includes(competitor.domain)
              );

              if (competitorResult) {
                keywordData.push({
                  keyword,
                  position: Number(competitorResult.position) || 0,
                  url: competitorResult.url || '',
                });
              }
            }

            // Rate limiting - wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Get previous snapshot for comparison
        const { data: previousSnapshot } = await supabase
          .from('analytics_snapshots')
          .select('keyword_rankings, domain_authority')
          .eq('competitor_id', competitor.id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .single();

        // Detect changes and create alerts
        if (previousSnapshot && keywordData.length > 0) {
          const previousRankings = previousSnapshot.keyword_rankings as any[] || [];

          for (const current of keywordData) {
            const previous = previousRankings.find((p: any) => p.keyword === current.keyword);

            if (previous && previous.position) {
              const positionChange = previous.position - current.position;

              // Alert if position changed by 5+ spots
              if (Math.abs(positionChange) >= 5) {
                alerts.push({
                  type: positionChange > 0 ? 'ranking_improved' : 'ranking_dropped',
                  domain: competitor.domain,
                  keyword: current.keyword,
                  change: positionChange,
                  severity: Math.abs(positionChange) >= 10 ? 'high' : 'medium',
                });
              }
            }
          }

          // Check domain authority change
          if (previousSnapshot.domain_authority && domainRank) {
            const rankChange = domainRank - (previousSnapshot.domain_authority as number);
            
            if (Math.abs(rankChange) >= 5) {
              alerts.push({
                type: 'domain_authority_change',
                domain: competitor.domain,
                change: rankChange,
                severity: Math.abs(rankChange) >= 10 ? 'high' : 'medium',
              });
            }
          }
        }

        // Save new snapshot
        const snapshot: CompetitorSnapshot = {
          domain: competitor.domain,
          keywords: keywordData,
          domain_rank: domainRank,
          backlinks_count: backlinksCount,
          referring_domains: referringDomains,
          organic_traffic_est: organicTrafficEst,
          snapshot_date: new Date().toISOString(),
        };

        await supabase.from('analytics_snapshots').insert({
          business_profile_id: competitor.business_profile_id,
          competitor_id: competitor.id,
          snapshot_date: snapshot.snapshot_date,
          keyword_rankings: keywordData,
          domain_authority: domainRank,
          backlink_count: backlinksCount,
          referring_domains: referringDomains,
          organic_traffic: organicTrafficEst,
          created_at: new Date().toISOString(),
        });

        snapshots.push(snapshot);

      } catch (error) {
        console.error(`Failed to monitor competitor ${competitor.domain}:`, error);
        // Continue with next competitor
      }
    }

    // Create notifications for alerts
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'competitor_alert',
          title: `Competitor ${alert.type.replace(/_/g, ' ')}`,
          message: `${alert.domain} ${alert.keyword ? `for "${alert.keyword}"` : ''} - ${alert.change > 0 ? '+' : ''}${alert.change} ${alert.type.includes('ranking') ? 'positions' : 'points'}`,
          data: alert,
          severity: alert.severity,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        snapshots_created: snapshots.length,
        alerts_generated: alerts.length,
        snapshots,
        alerts,
      },
    });
  } catch (error) {
    console.error('Competitor monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to monitor competitors' },
      { status: 500 }
    );
  }
}
