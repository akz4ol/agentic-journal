/**
 * Cloudflare Worker for GitHub OAuth Token Exchange
 *
 * Deploy this worker and update the callback.html to use it.
 *
 * Setup:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Add environment variable: GITHUB_CLIENT_SECRET
 * 5. Deploy and note the worker URL
 */

const CLIENT_ID = 'Ov23ligEG9UfAYdEHRJO';
const ALLOWED_ORIGIN = 'https://akz4ol.github.io';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { code } = await request.json();

      if (!code) {
        return new Response(JSON.stringify({ error: 'No code provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(JSON.stringify({ error: tokenData.error_description }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          },
        });
      }

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'User-Agent': 'Agentic-Journal-OAuth',
        },
      });

      const userData = await userResponse.json();

      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        user: {
          login: userData.login,
          avatar_url: userData.avatar_url,
          name: userData.name,
        },
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        },
      });
    }
  },
};
