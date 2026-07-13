import { Injectable } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  async saveImage(file: Express.Multer.File, folder: string): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });
    const ext = file.mimetype.split('/')[1];
    const filename = `${uuid()}.${ext}`;
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, file.buffer);
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:5000';
    return `${baseUrl}/uploads/${folder}/${filename}`;
  }
}
