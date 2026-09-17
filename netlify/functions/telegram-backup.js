/**
 * Netlify Serverless Function: Telegram Backup Relay
 * 
 * Replaces the Express server.js. Designed for Netlify's free tier.
 * Enforces an internal 4.5MB payload limit to respect Netlify's 6MB payload limit.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const MAX_PAYLOAD_BYTES = 4.5 * 1024 * 1024; // 4.5MB boundary
const TELEGRAM_CAPTION_LIMIT = 1024;

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed. Use POST.` })
    };
  }

  // Validate environment variables
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Telegram credentials not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your Netlify Site Configuration / Environment Variables.'
      })
    };
  }

  // Validate payload size (Netlify limit is 6MB; enforce 4.5MB limit)
  const bodyString = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');

  const payloadSizeBytes = Buffer.byteLength(bodyString, 'utf8');
  if (payloadSizeBytes > MAX_PAYLOAD_BYTES) {
    const sizeMb = (payloadSizeBytes / (1024 * 1024)).toFixed(2);
    return {
      statusCode: 413,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Payload size (${sizeMb} MB) exceeds the 4.5MB Netlify serverless limit. Please use the direct local file download option instead.`
      })
    };
  }

  // Parse payload
  let parsed;
  try {
    parsed = JSON.parse(bodyString);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON payload in request body.' })
    };
  }

  const { fileName = 'codebase_context.txt', fileContent, userInfo = '' } = parsed;

  if (!fileContent) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required field: fileContent.' })
    };
  }

  // Safely truncate caption to fit Telegram's 1024 character limit
  let caption = userInfo || '';
  if (caption.length > TELEGRAM_CAPTION_LIMIT) {
    caption = caption.substring(0, TELEGRAM_CAPTION_LIMIT - 3) + '...';
  }

  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (caption) {
      formData.append('caption', caption);
    }
    
    const fileBlob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    formData.append('document', fileBlob, fileName);

    // Call Telegram Bot API with an 8.5 second timeout to safely preempt Netlify's 10s ceiling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const jsonErr = JSON.parse(errorText);
        parsedError = jsonErr.description || errorText;
      } catch (_) {}

      return {
        statusCode: response.status >= 500 ? 502 : 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Telegram API Error: ${parsedError}` })
      };
    }

    const result = await response.json();
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Context file successfully uploaded to Telegram.',
        fileId: result.result?.document?.file_id
      })
    };
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return {
      statusCode: isTimeout ? 504 : 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: isTimeout
          ? 'Telegram upload timed out (exceeded 8.5s limit). Please use local download.'
          : `Failed to upload to Telegram: ${error.message}`
      })
    };
  }
};
