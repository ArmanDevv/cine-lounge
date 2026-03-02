import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

if (!REGION || !BUCKET) {
  console.warn('AWS_REGION or AWS_S3_BUCKET is not set. S3 service may not work properly.');
}

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const ALLOWED_MIME = ['video/mp4', 'video/quicktime', 'video/x-matroska'];

export async function generatePresignedUploadUrl(originalFileName: string, fileType: string) {
  if (!ALLOWED_MIME.includes(fileType)) {
    throw new Error('Invalid file type');
  }

  const id = uuidv4();
  const fileKey = `movies/${id}-${originalFileName}`;

  const putCommand = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: fileType,
  });

  // Expires in 5 minutes (300 seconds)
  const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 300 });

  const cloudfrontBase = process.env.CLOUDFRONT_URL || '';
  let videoUrl: string;
  
  if (cloudfrontBase) {
    // Ensure CloudFront URL has https:// prefix
    const cfUrl = cloudfrontBase.startsWith('http') ? cloudfrontBase : `https://${cloudfrontBase}`;
    videoUrl = `${cfUrl}/${fileKey}`;
  } else {
    videoUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fileKey}`;
  }

  console.log('Generated videoUrl:', videoUrl);

  return { uploadUrl, fileKey, videoUrl };
}

export async function generatePresignedReadUrl(fileKey: string, expiresIn: number = 3600) {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn });
    console.log(`Generated presigned read URL for ${fileKey}`);
    return presignedUrl;
  } catch (error) {
    console.error(`Failed to generate presigned read URL for ${fileKey}:`, error);
    throw error;
  }
}

export async function deleteFileFromS3(videoUrl: string) {
  try {
    // Extract file key from URL
    // URL format: https://bucket.s3.region.amazonaws.com/movies/uuid-filename or
    // https://cloudfront-url/movies/uuid-filename
    const fileKey = extractFileKeyFromUrl(videoUrl);
    
    if (!fileKey) {
      console.warn(`Could not extract file key from URL: ${videoUrl}`);
      return;
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
    });

    await s3Client.send(deleteCommand);
    console.log(`Successfully deleted file from S3: ${fileKey}`);
  } catch (error) {
    console.error(`Failed to delete file from S3:`, error);
    // Don't throw - we don't want to fail the operation if S3 delete fails
  }
}

function extractFileKeyFromUrl(videoUrl: string): string | null {
  try {
    // Handle both direct S3 and CloudFront URLs
    // S3: https://bucket.s3.region.amazonaws.com/movies/uuid-filename
    // CloudFront: https://xxxx.cloudfront.net/movies/uuid-filename
    
    const url = new URL(videoUrl);
    const pathname = url.pathname;
    
    // Remove leading slash and return the path
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  } catch (error) {
    console.error(`Failed to extract file key from URL: ${videoUrl}`, error);
    return null;
  }
}

export default { generatePresignedUploadUrl, generatePresignedReadUrl, deleteFileFromS3 };
