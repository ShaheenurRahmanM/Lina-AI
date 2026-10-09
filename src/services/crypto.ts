const STORAGE_KEY = 'lina_ai_encrypted_api_key';
const STORAGE_IV = 'lina_ai_encrypted_api_key_iv';
const SECRET_KEY = 'lina_ai_encryption_secret';
const FALLBACK_KEY = 'lina_ai_raw_api_key';

function base64Encode(buffer: ArrayBuffer | Uint8Array): string {
  try {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return '';
  }
}

function base64Decode(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function hasSubtleCrypto(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined';
}

// Simple fallback XOR obfuscation for insecure contexts (HTTP/local network testing)
function fallbackObfuscate(text: string): string {
  const salt = 'lina_ai_secure_salt_2025';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
  }
  return btoa(result);
}

function fallbackDeobfuscate(encoded: string): string | null {
  try {
    const raw = atob(encoded);
    const salt = 'lina_ai_secure_salt_2025';
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return result;
  } catch {
    return null;
  }
}

async function getSecretCryptoKey(): Promise<CryptoKey | null> {
  if (!hasSubtleCrypto()) return null;

  try {
    let raw = localStorage.getItem(SECRET_KEY);
    let keyData: Uint8Array | null = raw ? base64Decode(raw) : null;

    if (!keyData || keyData.length !== 32) {
      const newKey = crypto.getRandomValues(new Uint8Array(32));
      raw = base64Encode(newKey);
      localStorage.setItem(SECRET_KEY, raw);
      keyData = newKey;
    }

    return await crypto.subtle.importKey(
      'raw',
      keyData as unknown as BufferSource,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.warn('Failed to obtain subtle crypto key:', error);
    return null;
  }
}

export async function encryptApiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (!trimmed) return;

  try {
    const key = await getSecretCryptoKey();
    if (key && hasSubtleCrypto()) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(trimmed);
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

      localStorage.setItem(STORAGE_KEY, base64Encode(encrypted));
      localStorage.setItem(STORAGE_IV, base64Encode(iv));
      // Remove any fallback keys
      localStorage.removeItem(FALLBACK_KEY);
      return;
    }
  } catch (err) {
    console.warn('Subtle crypto encryption failed, falling back:', err);
  }

  // Fallback to obfuscated storage for non-secure / HTTP environments
  try {
    localStorage.setItem(FALLBACK_KEY, fallbackObfuscate(trimmed));
  } catch (storageErr) {
    console.error('LocalStorage write failed:', storageErr);
  }
}

export async function decryptApiKey(): Promise<string | null> {
  try {
    // 1. First check if a key is directly stored in plain or fallback
    const directFallback = localStorage.getItem(FALLBACK_KEY);
    if (directFallback) {
      const deobfuscated = fallbackDeobfuscate(directFallback);
      if (deobfuscated) return deobfuscated;
    }

    // 2. Check if user has an old unencrypted key in localStorage
    const legacyKey = localStorage.getItem('groq_api_key') || localStorage.getItem('GROQ_API_KEY');
    if (legacyKey && legacyKey.startsWith('gsk_')) {
      return legacyKey.trim();
    }

    const encrypted = localStorage.getItem(STORAGE_KEY);
    const iv = localStorage.getItem(STORAGE_IV);

    if (!encrypted) return null;

    // Check if the stored value is already a plain Groq key
    if (encrypted.startsWith('gsk_')) {
      return encrypted.trim();
    }

    if (!iv) return null;

    const key = await getSecretCryptoKey();
    if (!key || !hasSubtleCrypto()) {
      return null;
    }

    const encryptedBytes = base64Decode(encrypted);
    const ivBytes = base64Decode(iv);

    if (!encryptedBytes || !ivBytes) return null;

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
      key,
      encryptedBytes as unknown as BufferSource
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.warn('Failed to decrypt API key:', error);
    return null;
  }
}

export function getStoredEncryptedApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(FALLBACK_KEY) ||
      localStorage.getItem('groq_api_key') ||
      null;
  } catch {
    return null;
  }
}

export function clearEncryptedApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_IV);
    localStorage.removeItem(FALLBACK_KEY);
    localStorage.removeItem('groq_api_key');
    localStorage.removeItem('GROQ_API_KEY');
  } catch (err) {
    console.error('Failed to clear API key:', err);
  }
}
