export interface OcrResult {
  text: string
  transactionId: string | null
}

// Swap this stub for a real OCR call (tesseract.js / vision API) when ready.
// The caller MUST discard the File object after this returns — we never persist images.
export async function simulateOCR(_file: File): Promise<OcrResult> {
  await new Promise((r) => setTimeout(r, 1500))
  const ref = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')}`
  return {
    text: `Transfer ref ${ref} captured ${new Date().toISOString()}`,
    transactionId: ref,
  }
}
