import { Router, Request, Response } from 'express';
import { verifyAuth } from '../middlewares/auth';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const router = Router();

const S3_BUCKET = process.env.S3_BUCKET || 'demandly-uploads';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

router.post('/presigned-url', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { filename, filetype } = req.body;
    if (!filename || !filetype) {
      return res.status(400).json({ error: 'filename and filetype are required' });
    }

    const fileKey = `${(req as any).user.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${filename}`;

    const isAwsConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    if (isAwsConfigured) {
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      const s3 = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      });

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: filetype,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const fileUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;

      return res.json({ uploadUrl, fileUrl, sandbox: false });
    } else {
      // Mock Sandbox Mode (for development / local testing)
      const mockUploadUrl = `/api/upload/mock-receiver?key=${encodeURIComponent(fileKey)}`;
      const mockFileUrl = `/api/upload/mock-files/${fileKey}`;
      return res.json({
        uploadUrl: mockUploadUrl,
        fileUrl: mockFileUrl,
        sandbox: true
      });
    }
  } catch (error) {
    logger.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Mock receiver endpoint for Sandbox Mode
router.put('/mock-receiver', async (req: Request, res: Response): Promise<any> => {
  return res.status(200).json({ success: true, message: 'File uploaded to sandbox' });
});

export default router;
