import { v2 as cloudinary } from 'cloudinary';

// Images live on Cloudinary, not on the server's disk: Render's free disk is wiped
// on every redeploy/restart. MongoDB only stores the URL returned from here.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const isStorageConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

/**
 * Uploads an image buffer (from multer memory storage) to Cloudinary.
 * @returns {Promise<string>} The public https URL of the stored image
 */
export const uploadImage = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'quizplatform',
        resource_type: 'image', // Cloudinary rejects anything that isn't really an image
        // Shrink oversized photos once at upload time, so every student download is small
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
};
