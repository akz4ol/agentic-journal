/**
 * Cloudflare Worker for Direct PDF Upload to R2
 *
 * Handles secure PDF uploads for Agentic Journal submissions.
 *
 * Setup:
 * 1. Create R2 bucket named 'agentic-journal-pdfs' in Cloudflare dashboard
 * 2. Create Worker and bind R2 bucket as 'PDF_BUCKET'
 * 3. Add environment variables:
 *    - GITHUB_TOKEN: Personal access token with repo scope
 *    - UPLOAD_SECRET: Random secret for signing upload URLs
 * 4. Deploy worker
 */

const ALLOWED_ORIGIN = 'https://akz4ol.github.io';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const REPO_OWNER = 'akz4ol';
const REPO_NAME = 'agentic-journal';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handlers
      if (url.pathname === '/upload' && request.method === 'POST') {
        return await handleUpload(request, env, corsHeaders);
      }

      if (url.pathname === '/presign' && request.method === 'POST') {
        return await handlePresign(request, env, corsHeaders);
      }

      if (url.pathname.startsWith('/pdf/') && request.method === 'GET') {
        return await handleDownload(request, env, url.pathname);
      }

      if (url.pathname === '/trigger-review' && request.method === 'POST') {
        return await handleTriggerReview(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

/**
 * Generate presigned upload URL
 */
async function handlePresign(request, env, corsHeaders) {
  const { submissionId, filename, contentType, fileSize, githubToken } = await request.json();

  // Validate GitHub token
  const user = await validateGitHubToken(githubToken);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid GitHub token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate file
  if (!filename.toLowerCase().endsWith('.pdf')) {
    return new Response(JSON.stringify({ error: 'Only PDF files are allowed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (fileSize > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate upload token (valid for 10 minutes)
  const expiry = Date.now() + 10 * 60 * 1000;
  const key = `submissions/${submissionId}/paper.pdf`;
  const uploadToken = await generateUploadToken(env.UPLOAD_SECRET, submissionId, key, expiry);

  return new Response(JSON.stringify({
    uploadUrl: `https://agentic-journal-pdf.blog-mot2gmob.workers.dev/upload`,
    key,
    uploadToken,
    expiry,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle direct PDF upload
 */
async function handleUpload(request, env, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');
  const uploadToken = formData.get('uploadToken');
  const key = formData.get('key');
  const submissionId = formData.get('submissionId');

  // Validate upload token
  const isValid = await validateUploadToken(env.UPLOAD_SECRET, uploadToken, submissionId, key);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid or expired upload token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate file
  if (!file || file.size === 0) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await env.PDF_BUCKET.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: 'application/pdf',
    },
    customMetadata: {
      submissionId,
      uploadedAt: new Date().toISOString(),
      originalFilename: file.name,
    },
  });

  // Generate download URL
  const downloadUrl = `https://agentic-journal-pdf.blog-mot2gmob.workers.dev/pdf/${submissionId}`;

  return new Response(JSON.stringify({
    success: true,
    key,
    downloadUrl,
    size: file.size,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle PDF download (for workflow)
 */
async function handleDownload(request, env, pathname) {
  // Extract submission ID from path: /pdf/{submissionId}
  const submissionId = pathname.replace('/pdf/', '');
  const key = `submissions/${submissionId}/paper.pdf`;

  // Check authorization header for workflow access
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  // Validate it's a valid GitHub token with repo access
  const isValid = await validateGitHubToken(token);
  if (!isValid) {
    return new Response('Invalid token', { status: 401 });
  }

  // Get file from R2
  const object = await env.PDF_BUCKET.get(key);
  if (!object) {
    return new Response('PDF not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${submissionId}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

/**
 * Trigger review workflow via GitHub API
 */
async function handleTriggerReview(request, env, corsHeaders) {
  const { submissionId, metadata, pdfUrl, githubToken } = await request.json();

  // Validate GitHub token
  const user = await validateGitHubToken(githubToken);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid GitHub token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create issue to trigger workflow
  const issueBody = `## New Paper Submission (Direct Upload)

**Submission ID:** ${submissionId}
**Title:** ${metadata.title}
**Type:** ${metadata.paper_type}
**Authors:** ${metadata.authors.map(a => a.name).join(', ')}

### Abstract
${metadata.abstract}

### Keywords
${metadata.keywords.join(', ')}

${metadata.code_url ? `**Code:** ${metadata.code_url}` : ''}
${metadata.data_url ? `**Data:** ${metadata.data_url}` : ''}

### PDF Location
**Storage:** R2
**URL:** ${pdfUrl}

---
*Submitted via Agentic Journal Portal (Direct Upload)*
`;

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Agentic-Journal-Worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[Submission] ${metadata.title}`,
      body: issueBody,
      labels: ['submission', metadata.paper_type, 'direct-upload'],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return new Response(JSON.stringify({ error: `Failed to create issue: ${error}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const issue = await response.json();

  return new Response(JSON.stringify({
    success: true,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Validate GitHub token and return user info
 */
async function validateGitHubToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Agentic-Journal-Worker',
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Generate signed upload token
 */
async function generateUploadToken(secret, submissionId, key, expiry) {
  const data = `${submissionId}:${key}:${expiry}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${expiry}:${signatureHex}`;
}

/**
 * Validate upload token
 */
async function validateUploadToken(secret, token, submissionId, key) {
  if (!token) return false;

  const [expiry, signature] = token.split(':');

  // Check expiry
  if (Date.now() > parseInt(expiry)) return false;

  // Regenerate and compare
  const expected = await generateUploadToken(secret, submissionId, key, parseInt(expiry));
  return token === expected;
}
