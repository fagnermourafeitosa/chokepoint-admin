// Agent keys in the browser (Admin 029 section 2). The private key never leaves the browser:
// it goes only into the downloaded file. Xokepoint receives the public JWK.

// WebCrypto's JsonWebKey has no kid or use (RFC 7517 §4.5, §4.2).
export type Jwk = JsonWebKey & { kid?: string; use?: string };

const privateMembers = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k'];
const base64url = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const fileName = (agentName: string) => `${agentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent'}.chokepoint.json`;

// The public members of a JWK, without key_ops or ext from WebCrypto.
function publicJwk(jwk: JsonWebKey): JsonWebKey {
  return jwk.kty === 'EC' ? { kty: 'EC', crv: jwk.crv, x: jwk.x, y: jwk.y } : { kty: 'RSA', n: jwk.n, e: jwk.e };
}

// RFC 7638: SHA-256 of the required members in lexicographic order, base64url.
export async function thumbprint(jwk: JsonWebKey) {
  const members = jwk.kty === 'EC' ? `{"crv":"${jwk.crv}","kty":"EC","x":"${jwk.x}","y":"${jwk.y}"}` : `{"e":"${jwk.e}","kty":"RSA","n":"${jwk.n}"}`;
  return base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(members)));
}

export type GeneratedKey = { publicJwk: Jwk; privateJwk: Jwk; kid: string };

// An ECDSA P-256 (ES256) key pair; the key ID is its RFC 7638 thumbprint.
export async function generateKey(): Promise<GeneratedKey> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const [publicKey, privateKey] = await Promise.all([crypto.subtle.exportKey('jwk', pair.publicKey), crypto.subtle.exportKey('jwk', pair.privateKey)]);
  const kid = await thumbprint(publicKey);
  return { publicJwk: { ...publicJwk(publicKey), kid, alg: 'ES256', use: 'sig' }, privateJwk: { kty: 'EC', crv: privateKey.crv, x: privateKey.x, y: privateKey.y, d: privateKey.d, kid, alg: 'ES256', use: 'sig' }, kid };
}

export type AgentFile = { client_id: string; issuer: string; token_endpoint: string; kid: string; alg: 'ES256'; private_key: Jwk };

export function download(name: string, file: AgentFile) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  // The browser may read the file after click() returns; the URL is released later. It holds
  // the only copy of the private key.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type ParsedKey = { jwk: JsonWebKey; alg: 'ES256' | 'RS256' } | { error: string };
const notPublic = 'This is a private key. Paste only the public key.';
const unknown = 'Paste a public key as a JWK or as PEM (BEGIN PUBLIC KEY).';

// "Use my own public key": a JWK or an SPKI PEM. The Admin converts a PEM in the browser
// (Backend 030 Admin contract item 3); the backend validates the key.
export async function parsePublicKey(text: string): Promise<ParsedKey | undefined> {
  const value = text.trim();
  if (!value) return undefined;
  if (/PRIVATE KEY/.test(value)) return { error: notPublic };
  const pem = /^-----BEGIN PUBLIC KEY-----([\s\S]+)-----END PUBLIC KEY-----$/.exec(value);
  if (pem) {
    let der: ArrayBuffer;
    try { der = Uint8Array.from(atob(pem[1].replace(/\s+/g, '')), c => c.charCodeAt(0)).buffer; } catch { return { error: unknown }; }
    for (const [algorithm, alg] of [[{ name: 'ECDSA', namedCurve: 'P-256' }, 'ES256'], [{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, 'RS256']] as const) {
      try {
        const key = await crypto.subtle.importKey('spki', der, algorithm, true, ['verify']);
        return { jwk: publicJwk(await crypto.subtle.exportKey('jwk', key)), alg };
      } catch { /* try the next algorithm */ }
    }
    return { error: 'Use an EC P-256 or an RSA public key.' };
  }
  let jwk: JsonWebKey & Record<string, unknown>;
  try { jwk = JSON.parse(value); } catch { return { error: unknown }; }
  if (typeof jwk !== 'object' || jwk === null) return { error: unknown };
  if (privateMembers.some(member => member in jwk)) return { error: notPublic };
  if (jwk.kty === 'EC' && jwk.crv === 'P-256') return { jwk, alg: 'ES256' };
  if (jwk.kty === 'RSA') return { jwk, alg: 'RS256' };
  return { error: 'Use an EC P-256 or an RSA public key.' };
}
