/**
 * Uploads a file to the local server/ proxy (server/index.js POST /api/upload)
 * and returns the relative URL to store on the record (e.g. Operador.foto).
 * Swapping the backend's storage (disk -> S3/etc.) needs no frontend change,
 * since the contract is just "give me a file, get back a URL".
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('foto', file);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'No se pudo subir la imagen');
  }
  const body = await res.json();
  return body.url;
}
