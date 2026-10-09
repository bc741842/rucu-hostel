import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { randomUUID } from 'crypto';
import { cloudinary } from '../cloudinary/cloudinary.config';
 
// Faili yoyote (picha, audio, video, PDF, Word, ZIP, n.k.) inaweza
// kutumwa kwenye chat na inahifadhiwa Cloudinary (si diski ya server).
// Faili ni ya hiari - ujumbe unaweza kuwa maandishi tu, faili tu, au vyote
// viwili (maandishi kama caption ya faili). Kikomo pekee ni ukubwa wa
// faili (10MB).
export const chatMulterOptions = {
  storage: new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder: 'rucu-hostel/chat',
      resource_type: 'auto' as const, // Cloudinary inatambua picha/audio/video/faili nyingine zenyewe
      public_id: randomUUID(),
    }),
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
 
export function resolveMessageType(mimetype?: string): string {
  if (!mimetype) return 'text';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('video/')) return 'video';
  return 'file';
}
 