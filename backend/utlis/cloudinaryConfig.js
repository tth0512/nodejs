import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Kho lưu post images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'universe_posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

export const uploadCloud = multer({ storage });

// Kho lưu avatar (folder riêng, giới hạn 2MB)
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'universe_avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Kho lưu cover photo (landscape 1200×400, tối đa 5MB)
const coverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'universe_covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 400, crop: 'fill', gravity: 'center' }],
  },
});

export const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
