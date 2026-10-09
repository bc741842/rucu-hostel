import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { cloudinary } from '../cloudinary/cloudinary.config';
 
// PDF iliyoambatanishwa kwenye announcement inahifadhiwa Cloudinary
// (si diski ya server). Faili ni ya hiari - kama mtumiaji haichagui
// faili, interceptor haifanyi kitu na req.body inasomwa kama kawaida.
export const announcementMulterOptions = {
  storage: new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder: 'rucu-hostel/announcements',
      resource_type: 'raw' as const, // PDF si picha wala video
      public_id: randomUUID(),
    }),
  }),
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(
        new BadRequestException('Faili lazima liwe la aina ya PDF pekee.'),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
 