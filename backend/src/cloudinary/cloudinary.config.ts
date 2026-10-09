import { v2 as cloudinary } from 'cloudinary';
 
// Usanidi wa Cloudinary - thamani zake zinatoka kwenye .env (CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Faili zote za Chat na Announcements
// sasa zinahifadhiwa hapa (si kwenye diski ya server), ili zisipotee hosting za
// bure zinapo-restart backend mara kwa mara.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
export { cloudinary };