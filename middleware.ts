import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('dewi_session')?.value;

  const isPengelola = pathname.startsWith('/pengelola');
  const isDisbudparekraf = pathname.startsWith('/disbudparekraf');

  // 1. Jika belum login dan mengakses dashboard, lempar ke /login
  if (!token && (isPengelola || isDisbudparekraf)) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika ada session token
  if (token) {
    try {
      const [b64] = token.split('.');
      if (b64) {
        // Decode base64url payload
        const base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = atob(base64);
        const user = JSON.parse(jsonStr);

        // Cek kedaluwarsa sesi
        if (user.exp && Date.now() > user.exp) {
          const res = NextResponse.redirect(new URL('/login', req.url));
          res.cookies.delete('dewi_session');
          return res;
        }

        // Jika sudah login tapi buka /login, redirect ke dashboard masing-masing
        if (pathname === '/login') {
          const target = user.role === 'disbudparekraf' ? '/disbudparekraf' : '/pengelola';
          return NextResponse.redirect(new URL(target, req.url));
        }

        // Proteksi RBAC: Desa tidak boleh intip Disbudparekraf
        if (isDisbudparekraf && user.role !== 'disbudparekraf') {
          return NextResponse.redirect(new URL('/pengelola', req.url));
        }

        // Proteksi RBAC: Disbudparekraf tidak boleh ubah-ubah dashboard internal 1 desa
        if (isPengelola && user.role !== 'desa') {
          return NextResponse.redirect(new URL('/disbudparekraf', req.url));
        }
      }
    } catch {
      // Token tidak valid/rusak
      if (isPengelola || isDisbudparekraf) {
        const res = NextResponse.redirect(new URL('/login', req.url));
        res.cookies.delete('dewi_session');
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pengelola/:path*', '/disbudparekraf/:path*', '/login'],
};
