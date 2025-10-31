import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/config/env';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('competitorId');
    const businessProfileId = searchParams.get('businessProfileId');
    const days = parseInt(searchParams.get('days') || '30');

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

    // Build query
    let query = supabase
      .from('analytics_snapshots')
      .select(`
        *,
        competitors!inner(domain, business_profile_id)
      `)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('snapshot_date', { ascending: false });

    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    } else if (businessProfileId) {
      query = query.eq('business_profile_id', businessProfileId);

      // Verify ownership
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('id', businessProfileId)
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Business profile not found' },
          { status: 404 }
        );
      }
    } else {
      // Get all profiles for user
      const { data: profiles } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id);

      if (profiles && profiles.length > 0) {
        query = query.in('business_profile_id', profiles.map(p => p.id));
      }
    }

    const { data: snapshots, error } = await query;

    if (error) {
      throw error;
    }

    // Group by competitor domain
    const snapshotsByDomain = snapshots.reduce((acc: any, snapshot: any) => {
      const domain = snapshot.competitors?.domain;
      if (!domain) return acc;

      if (!acc[domain]) {
        acc[domain] = [];
      }

      acc[domain].push({
        id: snapshot.id,
        snapshot_date: snapshot.snapshot_date,
        domain_authority: snapshot.domain_authority,
        backlink_count: snapshot.backlink_count,
        referring_domains: snapshot.referring_domains,
        organic_traffic: snapshot.organic_traffic,
        keyword_rankings: snapshot.keyword_rankings,
      });

      return acc;
    }, {});

    // Calculate trends
    const trends = Object.entries(snapshotsByDomain).map(([domain, snapshots]: [string, any]) => {
      if (snapshots.length < 2) {
        return {
          domain,
          trend: 'stable',
          metrics: {
            domain_authority: { current: snapshots[0]?.domain_authority, change: 0 },
            backlinks: { current: snapshots[0]?.backlink_count, change: 0 },
            traffic: { current: snapshots[0]?.organic_traffic, change: 0 },
          },
        };
      }

      const latest = snapshots[0];
      const previous = snapshots[snapshots.length - 1];

      const daChange = (latest.domain_authority || 0) - (previous.domain_authority || 0);
      const backlinksChange = (latest.backlink_count || 0) - (previous.backlink_count || 0);
      const trafficChange = (latest.organic_traffic || 0) - (previous.organic_traffic || 0);

      const trend = 
        daChange > 5 || backlinksChange > 50 || trafficChange > 1000 ? 'improving' :
        daChange < -5 || backlinksChange < -50 || trafficChange < -1000 ? 'declining' :
        'stable';

      return {
        domain,
        trend,
        metrics: {
          domain_authority: { 
            current: latest.domain_authority, 
            change: daChange,
            percentage: previous.domain_authority ? ((daChange / previous.domain_authority) * 100).toFixed(1) : 0
          },
          backlinks: { 
            current: latest.backlink_count, 
            change: backlinksChange,
            percentage: previous.backlink_count ? ((backlinksChange / previous.backlink_count) * 100).toFixed(1) : 0
          },
          traffic: { 
            current: latest.organic_traffic, 
            change: trafficChange,
            percentage: previous.organic_traffic ? ((trafficChange / previous.organic_traffic) * 100).toFixed(1) : 0
          },
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        snapshots: snapshotsByDomain,
        trends,
        total_snapshots: snapshots.length,
        date_range: {
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Snapshots fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}
