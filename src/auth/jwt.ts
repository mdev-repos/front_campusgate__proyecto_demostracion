export interface JwtPayload {
  sub: string
  iss: string
  iat: number
  exp: number
  jti: string
  permissions: string[]
}

export interface DecodedJwt {
  header: Record<string, unknown>
  payload: JwtPayload
  signature: string
}

function decodeSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

// Decoding is NOT verifying: anyone can read a JWT, only the server can check the signature.
export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null
    return {
      header: decodeSegment(header) as Record<string, unknown>,
      payload: decodeSegment(payload) as JwtPayload,
      signature,
    }
  } catch {
    return null
  }
}
