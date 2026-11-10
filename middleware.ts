import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Harus sama dengan lib/auth.ts. Middleware berjalan di Edge runtime, jadi
// verifikasi HMAC memakai Web Crypto (node:crypto tidak tersedia di sini).
const SESSION_SECRET = process.env.SESSION_SECRET || 'dewi-jateng-secret-session-key-2026';

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.length % 2 === 0 ? hex : hex.slice(0, -1);
  const buffer = new ArrayBuffer(clean.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Verifikasi tanda tangan HMAC-SHA256 atas payload base64url. */
async function verifySignature(b64: string, sigHex: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(sigHex),
      new TextEncoder().encode(b64)
    );
  } catch {
    return false;
  }
}

function decodePayload(b64: string): any | null {
  try {
    const json = new TextDecoder().decode(base64urlToBytes(b64));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('dewi_session')?.value;

  const isPengelola = pathname.startsWith('/pengelola');
  const isDisbudparekraf = pathname.startsWith('/disbudparekraf');

  const toLogin = () => {
    const loginUrl = new URL('/login', req.url);
    if (isPengelola || isDisbudparekraf) loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('dewi_session');
    return res;
  };

  // 1. Belum login & mengakses dashboard → /login
  if (!token && (isPengelola || isDisbudparekraf)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const [b64, sig] = token.split('.');

    // Token cacat atau tanda tangan tidak sah → paksa login ulang.
    if (!b64 || !sig || !(await verifySignature(b64, sig))) {
      return toLogin();
    }

    const user = decodePayload(b64);
    if (!user || !user.exp || Date.now() > user.exp) {
      return toLogin();
    }

    if (pathname === '/login') {
      const target = user.role === 'disbudparekraf' ? '/disbudparekraf' : '/pengelola';
      return NextResponse.redirect(new URL(target, req.url));
    }

    // RBAC: desa tidak boleh intip Disbudparekraf, dan sebaliknya.
    if (isDisbudparekraf && user.role !== 'disbudparekraf') {
      return NextResponse.redirect(new URL('/pengelola', req.url));
    }
    if (isPengelola && user.role !== 'desa') {
      return NextResponse.redirect(new URL('/disbudparekraf', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pengelola/:path*', '/disbudparekraf/:path*', '/login'],
};
