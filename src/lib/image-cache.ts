import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function getCachedImageBase64(url: string, loader: () => Promise<{ data: string; width?: number; height?: number } | null>) {
  try {
    const cacheDir = path.join(process.cwd(), 'tmp', 'image-cache');
    await fs.promises.mkdir(cacheDir, { recursive: true });
    const hash = crypto.createHash('sha1').update(url).digest('hex');
    const filePath = path.join(cacheDir, `${hash}.json`);
    // Return cached if exists
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      // ignore and fetch
    }

    const result = await loader();
    if (result) {
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(result), 'utf-8');
      } catch (e) {
        // ignore write errors
      }
    }
    return result;
  } catch (err) {
    try {
      return await loader();
    } catch (e) {
      return null;
    }
  }
}
