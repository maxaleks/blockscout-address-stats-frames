import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { SatoriOptions } from 'satori';

const FONTS = [
  { name: 'Inter', weight: 400, fileName: 'Inter-Regular.ttf' },
  { name: 'Inter', weight: 500, fileName: 'Inter-Medium.ttf' },
  { name: 'Inter', weight: 600, fileName: 'Inter-SemiBold.ttf' },
  { name: 'Inter', weight: 700, fileName: 'Inter-Bold.ttf' },
];

export default async function getFonts() {
  const data = await Promise.all(
    FONTS.map(async (font) => fs.readFile(path.join(path.resolve(process.cwd(), 'public'), font.fileName)))
  );
  return FONTS.map((font, index) => ({
    name: font.name,
    weight: font.weight,
    data: data[index],
  })) as SatoriOptions['fonts'];
}
