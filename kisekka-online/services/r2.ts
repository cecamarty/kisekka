/**
 * R2 upload service — Expo Go compatible.
 *
 * Uses expo-file-system for the actual HTTP upload and crypto-js for
 * AWS Signature Version 4 signing (pure JS, no native deps).
 *
 * R2 is S3-compatible, so standard AWS Sig V4 applies.
 * We use the UNSIGNED-PAYLOAD option to avoid hashing the file body on device.
 */

// Import from the legacy namespace — expo-file-system v18 moved upload APIs here
import {
  createUploadTask,
  FileSystemUploadType,
} from 'expo-file-system/legacy';
import CryptoJS from 'crypto-js';

const ACCOUNT_ID  = process.env.EXPO_PUBLIC_R2_ACCOUNT_ID ?? '';
const ACCESS_KEY  = process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID ?? '';
const SECRET_KEY  = process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY ?? '';
const BUCKET      = process.env.EXPO_PUBLIC_R2_BUCKET_NAME ?? '';
const PUBLIC_URL  = process.env.EXPO_PUBLIC_R2_PUBLIC_URL ?? '';

const REGION  = 'auto'; // R2 always uses "auto"
const SERVICE = 's3';
const HOST    = `${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com`;

// ── Sig V4 helpers ─────────────────────────────────────────────────────────────

function hmac(key: CryptoJS.lib.WordArray | string, data: string): CryptoJS.lib.WordArray {
  return CryptoJS.HmacSHA256(data, key);
}

function sha256Hex(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

function getSigningKey(dateStamp: string): CryptoJS.lib.WordArray {
  const kDate    = hmac('AWS4' + SECRET_KEY, dateStamp);
  const kRegion  = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, 'aws4_request');
}

function buildAuthHeader(
  key: string,
  dateTime: string,
  dateStamp: string,
  contentType: string
): Record<string, string> {
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${HOST}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${dateTime}\n`;

  const canonicalRequest = [
    'PUT',
    `/${key}`,
    '', // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateTime,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(dateStamp);
  const signature  = hmac(signingKey, stringToSign).toString(CryptoJS.enc.Hex);

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    Authorization: authorization,
    'x-amz-date': dateTime,
    'x-amz-content-sha256': payloadHash,
    'Content-Type': contentType,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Upload a local file URI to R2.
 * @param localUri  - file:// or content:// URI from ImagePicker
 * @param key       - R2 object key, e.g. "posts/{postId}/0.jpg"
 * @param onProgress - called with 0–1 fraction as upload progresses
 * @returns public R2 URL
 */
export async function uploadToR2(
  localUri: string,
  key: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!ACCESS_KEY || !SECRET_KEY || !BUCKET || !ACCOUNT_ID) {
    throw new Error('R2 credentials are not configured. Check your .env file.');
  }

  const now      = new Date();
  const dateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = dateTime.slice(0, 8);

  // Infer content type from extension
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };
  const contentType = contentTypeMap[ext] ?? 'application/octet-stream';

  const uploadUrl = `https://${HOST}/${key}`;
  const headers   = buildAuthHeader(key, dateTime, dateStamp, contentType);

  const task = createUploadTask(
    uploadUrl,
    localUri,
    {
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      httpMethod: 'PUT',
      headers,
    },
    (data) => {
      if (onProgress && data.totalBytesExpectedToSend > 0) {
        onProgress(data.totalBytesSent / data.totalBytesExpectedToSend);
      }
    }
  );

  const result = await task.uploadAsync();

  if (!result || (result.status !== 200 && result.status !== 204)) {
    throw new Error(`R2 upload failed with status ${result?.status ?? 'unknown'}`);
  }

  return `${PUBLIC_URL}/${key}`;
}
