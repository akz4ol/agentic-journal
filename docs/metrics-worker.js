/**
 * Agentic Journal Metrics Worker
 *
 * Cloudflare Worker for tracking paper metrics:
 * - View counts
 * - Download counts
 * - Citation tracking
 * - Author analytics
 *
 * Environment Variables:
 * - METRICS_KV: KV namespace for storing metrics
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      // GET /metrics/:paperId - Get metrics for a paper
      if (request.method === 'GET' && url.pathname.startsWith('/metrics/')) {
        const paperId = url.pathname.split('/')[2];
        const metrics = await getPaperMetrics(env, paperId);
        return jsonResponse(metrics);
      }

      // POST /view/:paperId - Record a view
      if (request.method === 'POST' && url.pathname.startsWith('/view/')) {
        const paperId = url.pathname.split('/')[2];
        await recordView(env, paperId, request);
        return jsonResponse({ success: true });
      }

      // POST /download/:paperId - Record a download
      if (request.method === 'POST' && url.pathname.startsWith('/download/')) {
        const paperId = url.pathname.split('/')[2];
        await recordDownload(env, paperId);
        return jsonResponse({ success: true });
      }

      // GET /stats - Get overall journal stats
      if (request.method === 'GET' && url.pathname === '/stats') {
        const stats = await getJournalStats(env);
        return jsonResponse(stats);
      }

      // GET /trending - Get trending papers
      if (request.method === 'GET' && url.pathname === '/trending') {
        const trending = await getTrendingPapers(env);
        return jsonResponse(trending);
      }

      // GET /author/:name - Get author stats
      if (request.method === 'GET' && url.pathname.startsWith('/author/')) {
        const authorName = decodeURIComponent(url.pathname.split('/')[2]);
        const stats = await getAuthorStats(env, authorName);
        return jsonResponse(stats);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

async function getPaperMetrics(env, paperId) {
  const key = `paper:${paperId}`;
  const data = await env.METRICS_KV.get(key, 'json');

  if (!data) {
    return {
      paperId,
      views: 0,
      downloads: 0,
      citations: 0,
      shares: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0
    };
  }

  // Calculate time-based views
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const viewHistory = data.viewHistory || [];

  return {
    paperId,
    views: data.views || 0,
    downloads: data.downloads || 0,
    citations: data.citations || 0,
    shares: data.shares || 0,
    viewsToday: viewHistory.filter(t => t > dayAgo).length,
    viewsThisWeek: viewHistory.filter(t => t > weekAgo).length,
    viewsThisMonth: viewHistory.filter(t => t > monthAgo).length
  };
}

async function recordView(env, paperId, request) {
  const key = `paper:${paperId}`;
  const data = await env.METRICS_KV.get(key, 'json') || {
    views: 0,
    downloads: 0,
    citations: 0,
    shares: 0,
    viewHistory: []
  };

  data.views = (data.views || 0) + 1;

  // Keep last 1000 view timestamps for analytics
  data.viewHistory = data.viewHistory || [];
  data.viewHistory.push(Date.now());
  if (data.viewHistory.length > 1000) {
    data.viewHistory = data.viewHistory.slice(-1000);
  }

  // Track unique viewers by IP (hashed)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashString(ip);
  data.uniqueViewers = data.uniqueViewers || new Set();
  if (typeof data.uniqueViewers === 'object' && !Array.isArray(data.uniqueViewers)) {
    data.uniqueViewers = Array.from(data.uniqueViewers);
  }
  if (!data.uniqueViewers.includes(ipHash)) {
    data.uniqueViewers.push(ipHash);
    // Limit to last 10000 unique viewers
    if (data.uniqueViewers.length > 10000) {
      data.uniqueViewers = data.uniqueViewers.slice(-10000);
    }
  }

  await env.METRICS_KV.put(key, JSON.stringify(data));

  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  const dailyKey = `daily:${today}`;
  const dailyData = await env.METRICS_KV.get(dailyKey, 'json') || { views: 0, papers: {} };
  dailyData.views++;
  dailyData.papers[paperId] = (dailyData.papers[paperId] || 0) + 1;
  await env.METRICS_KV.put(dailyKey, JSON.stringify(dailyData));
}

async function recordDownload(env, paperId) {
  const key = `paper:${paperId}`;
  const data = await env.METRICS_KV.get(key, 'json') || {
    views: 0,
    downloads: 0,
    citations: 0,
    shares: 0
  };

  data.downloads = (data.downloads || 0) + 1;
  data.downloadHistory = data.downloadHistory || [];
  data.downloadHistory.push(Date.now());

  if (data.downloadHistory.length > 500) {
    data.downloadHistory = data.downloadHistory.slice(-500);
  }

  await env.METRICS_KV.put(key, JSON.stringify(data));
}

async function getJournalStats(env) {
  const statsKey = 'journal:stats';
  let stats = await env.METRICS_KV.get(statsKey, 'json');

  if (!stats || Date.now() - (stats.updatedAt || 0) > 3600000) {
    // Recalculate stats hourly
    stats = await calculateJournalStats(env);
    stats.updatedAt = Date.now();
    await env.METRICS_KV.put(statsKey, JSON.stringify(stats));
  }

  return stats;
}

async function calculateJournalStats(env) {
  // This would iterate through all papers in production
  // For now, return placeholder stats
  return {
    totalPapers: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalCitations: 0,
    totalAuthors: 0,
    avgReviewTime: '24 hours',
    acceptanceRate: '35%'
  };
}

async function getTrendingPapers(env) {
  const today = new Date().toISOString().split('T')[0];
  const dailyKey = `daily:${today}`;
  const dailyData = await env.METRICS_KV.get(dailyKey, 'json');

  if (!dailyData || !dailyData.papers) {
    return [];
  }

  // Sort papers by views today
  const trending = Object.entries(dailyData.papers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([paperId, views]) => ({
      paperId,
      viewsToday: views
    }));

  return trending;
}

async function getAuthorStats(env, authorName) {
  const key = `author:${authorName.toLowerCase()}`;
  const data = await env.METRICS_KV.get(key, 'json');

  if (!data) {
    return {
      name: authorName,
      papers: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalCitations: 0,
      hIndex: 0
    };
  }

  return data;
}

async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
