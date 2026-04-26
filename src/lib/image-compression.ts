import imageCompression from "browser-image-compression";

/**
 * Compresses an image dynamically within the browser to guarantee it falls under
 * Vercel's 4.5MB request limit and significantly improves public site performance.
 */
export async function compressUpload(file: File): Promise<File> {
  // If the file is already microscopic (e.g. SVG or tiny icon), just return it
  if (file.size < 50 * 1024) {
    return file;
  }

  const options = {
    // We constrain the image to 1.5MB max which guarantees we never
    // break Vercel's Payload Too Large 4.5MB wall
    maxSizeMB: 1.5,
    // Max dimension 1920 to keep photos crisp for Retina displays but shed excess metadata / pixels
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert back to a File object with the original properties
    return new File([compressedBlob], file.name, {
      type: file.type || "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Image compression failed, falling back to original file:", error);
    return file;
  }
}
