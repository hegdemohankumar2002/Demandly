import { API_URL } from './api';

export async function uploadFile(file: File, token: string): Promise<string> {
  // 1. Get presigned URL
  const urlRes = await fetch(`${API_URL}/upload/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      filename: file.name,
      filetype: file.type
    })
  });

  if (!urlRes.ok) {
    throw new Error('Failed to get upload URL');
  }

  const { uploadUrl, fileUrl, sandbox } = await urlRes.json();

  // 2. Upload file to presigned URL
  if (sandbox) {
    // Local / Sandbox Receiver simulation: call mock receiver endpoint
    const uploadRes = await fetch(`${API_URL}${uploadUrl}`, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });
    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to sandbox');
    }
  } else {
    // Real S3 PUT call
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });
    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to S3');
    }
  }

  return fileUrl; // returns the S3 / Sandbox URL of the file
}
