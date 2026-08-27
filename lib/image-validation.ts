import sharp from 'sharp';

export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  size: number;
}

export async function validateImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.format || !metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }

    // Check for reasonable dimensions (prevent extreme sizes)
    const MAX_DIMENSION = 10000;
    const MIN_DIMENSION = 10;
    
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      throw new Error('Image dimensions too large');
    }
    
    if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
      throw new Error('Image dimensions too small');
    }

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length,
    };
  } catch (error) {
    throw new Error(`Failed to validate image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function isMimeTypeValid(mimeType: string): boolean {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedMimeTypes.includes(mimeType);
}

export function isExtensionValid(extension: string): boolean {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return allowedExtensions.includes(extension.toLowerCase());
}
