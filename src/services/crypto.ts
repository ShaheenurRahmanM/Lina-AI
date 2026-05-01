const STORAGE_KEY = 'lina_ai_encrypted_api_key';
const STORAGE_IV = 'lina_ai_encrypted_api_key_iv';
const SECRET_KEY = 'lina_ai_encryption_secret';

function base64Encode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64Decode(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function getSecretCryptoKey(): Promise<CryptoKey> {
  let raw = localStorage.getItem(SECRET_KEY);
  if (!raw) {
    const key = crypto.getRandomValues(new Uint8Array(32));
    raw = base64Encode(key.buffer);
    localStorage.setItem(SECRET_KEY, raw);
  }
  const keyData = base64Decode(raw);
  return crypto.subtle.importKey('raw', keyData, 'AES-GCM', true, ['encrypt', 'decrypt']);
}

export async function encryptApiKey(apiKey: string) {
  const key = await getSecretCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  localStorage.setItem(STORAGE_KEY, base64Encode(encrypted));
  localStorage.setItem(STORAGE_IV, base64Encode(iv.buffer));
}

export async function decryptApiKey(): Promise<string | null> {
  const key = await getSecretCryptoKey();
  const encrypted = localStorage.getItem(STORAGE_KEY);
  const iv = localStorage.getItem(STORAGE_IV);
  if (!encrypted || !iv) {
    return null;
  }
  try {
    const encryptedBytes = base64Decode(encrypted);
    const ivBytes = base64Decode(iv);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, encryptedBytes);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt API key', error);
    return null;
  }
}

export function getStoredEncryptedApiKey() {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearEncryptedApiKey() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_IV);
}
