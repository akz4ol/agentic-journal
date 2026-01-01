/**
 * Cloudflare Worker for Email Notifications
 *
 * Sends email notifications to authors when reviews are complete.
 * Uses Resend API for reliable email delivery.
 *
 * Setup:
 * 1. Create account at resend.com
 * 2. Get API key and verify domain
 * 3. Add environment variable: RESEND_API_KEY
 * 4. Deploy worker
 */

const ALLOWED_ORIGIN = 'https://akz4ol.github.io';
const FROM_EMAIL = 'notifications@agentic-journal.com';
const JOURNAL_URL = 'https://akz4ol.github.io/agentic-journal';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/notify/submission-received' && request.method === 'POST') {
        return await handleSubmissionReceived(request, env, corsHeaders);
      }

      if (url.pathname === '/notify/review-complete' && request.method === 'POST') {
        return await handleReviewComplete(request, env, corsHeaders);
      }

      if (url.pathname === '/notify/revision-requested' && request.method === 'POST') {
        return await handleRevisionRequested(request, env, corsHeaders);
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
 * Send email via Resend API
 */
async function sendEmail(env, to, subject, html) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await response.json();
}

/**
 * Handle submission received notification
 */
async function handleSubmissionReceived(request, env, corsHeaders) {
  const { submissionId, title, authorEmail, authorName } = await request.json();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agentic Journal</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Submission Received</p>
    </div>
    <div class="content">
      <p>Dear ${authorName || 'Author'},</p>

      <p>Thank you for submitting your paper to Agentic Journal. We have received your submission and it is now being processed by our AI-powered peer review system.</p>

      <div class="info-box">
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Status:</strong> Processing</p>
      </div>

      <h3>What happens next?</h3>
      <ul>
        <li>Your paper will be reviewed by multiple specialized AI agents</li>
        <li>Each agent evaluates different aspects: technical quality, domain expertise, ethics, and clarity</li>
        <li>A meta-review synthesizes all feedback into a final decision</li>
        <li>You will receive results within 24-48 hours</li>
      </ul>

      <a href="${JOURNAL_URL}/dashboard/" class="btn">Track Your Submission</a>

      <div class="footer">
        <p>Agentic Journal - AI-Powered Peer Review</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail(env, authorEmail, `[Agentic Journal] Submission Received: ${title}`, html);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle review complete notification
 */
async function handleReviewComplete(request, env, corsHeaders) {
  const {
    submissionId,
    title,
    authorEmail,
    authorName,
    decision,
    scores,
    summary
  } = await request.json();

  const decisionColors = {
    'Accept': '#28a745',
    'Minor Revision': '#17a2b8',
    'Major Revision': '#ffc107',
    'Reject': '#dc3545'
  };

  const decisionColor = decisionColors[decision] || '#666';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .decision-badge { display: inline-block; background: ${decisionColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .score-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .score-table th, .score-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .score-table th { background: #f0f0f0; }
    .score-bar { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    .score-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); }
    .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agentic Journal</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Review Complete</p>
    </div>
    <div class="content">
      <p>Dear ${authorName || 'Author'},</p>

      <p>The review of your submission to Agentic Journal has been completed. Please find the results below.</p>

      <div class="info-box">
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p style="margin-top: 15px;"><strong>Decision:</strong> <span class="decision-badge">${decision}</span></p>
      </div>

      <h3>Review Scores</h3>
      <table class="score-table">
        <tr>
          <th>Criterion</th>
          <th>Score</th>
          <th>Rating</th>
        </tr>
        ${Object.entries(scores || {}).map(([key, value]) => `
        <tr>
          <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
          <td>${value}/5.0</td>
          <td>
            <div class="score-bar">
              <div class="score-fill" style="width: ${(value / 5) * 100}%;"></div>
            </div>
          </td>
        </tr>
        `).join('')}
      </table>

      ${summary ? `
      <h3>Summary</h3>
      <div class="info-box">
        <p>${summary}</p>
      </div>
      ` : ''}

      <a href="${JOURNAL_URL}/dashboard/" class="btn">View Full Review</a>

      <div class="footer">
        <p>Agentic Journal - AI-Powered Peer Review</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail(env, authorEmail, `[Agentic Journal] Review Complete: ${title} - ${decision}`, html);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Handle revision requested notification
 */
async function handleRevisionRequested(request, env, corsHeaders) {
  const {
    submissionId,
    title,
    authorEmail,
    authorName,
    revisionType,
    feedback
  } = await request.json();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .feedback-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .feedback-item:last-child { border-bottom: none; }
    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agentic Journal</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Revision Requested</p>
    </div>
    <div class="content">
      <p>Dear ${authorName || 'Author'},</p>

      <p>Thank you for your submission to Agentic Journal. Our review process has identified areas that require revision before we can proceed with publication.</p>

      <div class="info-box">
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Revision Type:</strong> ${revisionType}</p>
      </div>

      <h3>Requested Changes</h3>
      <div class="info-box">
        ${Array.isArray(feedback) ? feedback.map(f => `
          <div class="feedback-item">
            <strong>${f.category}:</strong> ${f.comment}
          </div>
        `).join('') : `<p>${feedback}</p>`}
      </div>

      <h3>Next Steps</h3>
      <ol>
        <li>Review the feedback carefully</li>
        <li>Address each point in your revised manuscript</li>
        <li>Submit your revision through the portal</li>
        <li>Your revision will undergo a streamlined re-review</li>
      </ol>

      <a href="${JOURNAL_URL}/portal/" class="btn">Submit Revision</a>

      <div class="footer">
        <p>Agentic Journal - AI-Powered Peer Review</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail(env, authorEmail, `[Agentic Journal] Revision Requested: ${title}`, html);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
