import * as ImageManipulator from 'expo-image-manipulator';

const CLOUD_NAME = 'qqs1qnzj';
const UPLOAD_PRESET = 'dariimmo_unsigned';
const MAX_WIDTH = 1280;

async function toBase64(uri: string, width?: number): Promise<string> {
  const M: any = ImageManipulator;
  const needsResize = !width || width > MAX_WIDTH;

  if (M.ImageManipulator?.manipulate) {
    const ctx = M.ImageManipulator.manipulate(uri);
    if (needsResize) ctx.resize({ width: MAX_WIDTH });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({
      format: M.SaveFormat.JPEG,
      compress: 0.75,
      base64: true,
    });
    if (out?.base64) return out.base64;
  }

  // API 9dima
  if (M.manipulateAsync) {
    const out = await M.manipulateAsync(
      uri,
      needsResize ? [{ resize: { width: MAX_WIDTH } }] : [],
      { compress: 0.75, format: M.SaveFormat.JPEG, base64: true }
    );
    if (out?.base64) return out.base64;
  }

  throw new Error('Impossible de préparer la photo');
}

export async function uploadImage(uri: string, width?: number): Promise<string> {
  const base64 = await toBase64(uri, width);

  const fields: Record<string, string> = {
    file: `data:image/jpeg;base64,${base64}`,
    upload_preset: UPLOAD_PRESET,
    folder: 'dariimmo/listings',
  };
  const body = Object.entries(fields)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Upload photo échoué (${text})`);
    return JSON.parse(text).secure_url as string;
  } finally {
    clearTimeout(timer);
  }
}