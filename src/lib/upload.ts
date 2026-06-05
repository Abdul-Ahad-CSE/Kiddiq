'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Saves a file to the local public directory during development.
 * This is a Server Action that can be called from client or server files.
 * This can be easily swapped for Cloudinary dynamic upload when keys are ready.
 * 
 * @param formData FormData containing the file with key 'file'
 * @returns The public URL path of the saved file
 */
export async function uploadMediaAction(formData: FormData): Promise<string> {
  const file = formData.get('file') as File | null;
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the public/uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique name to prevent duplicate collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}`;
    const filePath = join(uploadsDir, filename);

    await writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Failed to save file locally:', error);
    throw new Error('File upload failed');
  }
}
