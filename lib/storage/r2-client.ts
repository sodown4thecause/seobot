/**
 * Cloudflare R2 Storage Client
 * 
 * S3-compatible object storage using Cloudflare R2
 * Handles image uploads, downloads, and deletions
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Validate environment variables
const validateEnv = () => {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn(`[R2] Missing environment variables: ${missing.join(', ')}`)
  }
}

validateEnv()

const endpoint = process.env.R2_ENDPOINT || 
  `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const s3Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const bucketName = process.env.R2_BUCKET_NAME || 'imagebucket'

export interface UploadOptions {
  contentType?: string
  cacheControl?: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  success: boolean
  key: string
  url: string
  error?: string
}

/**
 * Upload a file/buffer to R2
 */
export async function uploadToR2(
  key: string,
  data: Buffer | Uint8Array | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    if (!process.env.R2_ACCESS_KEY_ID) {
      throw new Error('R2 credentials not configured')
    }

    const buffer = typeof data === 'string' 
      ? Buffer.from(data, 'base64') 
      : Buffer.from(data)

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || 'application/octet-stream',
      CacheControl: options.cacheControl,
      Metadata: options.metadata,
    })

    await s3Client.send(command)

    const publicUrl = `${endpoint}/${bucketName}/${key}`

    console.log(`[R2] Uploaded: ${key}`)

    return {
      success: true,
      key,
      url: publicUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[R2] Upload failed for ${key}:`, errorMessage)
    return {
      success: false,
      key,
      url: '',
      error: errorMessage,
    }
  }
}

/**
 * Get a signed URL for downloading from R2
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    if (!process.env.R2_ACCESS_KEY_ID) {
      throw new Error('R2 credentials not configured')
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error(`[R2] Failed to generate signed URL for ${key}:`, error)
    return null
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    if (!process.env.R2_ACCESS_KEY_ID) {
      throw new Error('R2 credentials not configured')
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await s3Client.send(command)
    console.log(`[R2] Deleted: ${key}`)
    return true
  } catch (error) {
    console.error(`[R2] Delete failed for ${key}:`, error)
    return false
  }
}

/**
 * Check if a file exists in R2
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    if (!process.env.R2_ACCESS_KEY_ID) {
      throw new Error('R2 credentials not configured')
    }

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error: unknown) {
    const err = error as { name?: string }
    if (err.name === 'NotFound') {
      return false
    }
    console.error(`[R2] Existence check failed for ${key}:`, error)
    return false
  }
}

/**
 * Get public URL for a file in R2
 */
export function getPublicUrl(key: string): string {
  return `${endpoint}/${bucketName}/${key}`
}

/**
 * Batch upload multiple files to R2
 */
export async function batchUploadToR2(
  files: Array<{ key: string; data: Buffer | Uint8Array | string; options?: UploadOptions }>
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(({ key, data, options }) => uploadToR2(key, data, options))
  )
  return results
}

/**
 * Generate a unique filename for uploaded images
 */
export function generateImageKey(prefix: string = 'generated'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}/${timestamp}-${random}.png`
}

export default {
  uploadToR2,
  getSignedDownloadUrl,
  deleteFromR2,
  fileExistsInR2,
  getPublicUrl,
  batchUploadToR2,
  generateImageKey,
}
