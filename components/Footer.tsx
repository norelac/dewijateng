import Link from 'next/link';
import {
  MapPin,
  Mail,
  Phone,
  Home,
  Compass,
  FileText,
  BarChart2,
  BookOpen,
  Search,
  PlusCircle,
  Activity,
  Info,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0D2453] text-white mt-24 w-full">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-[56px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start justify-between">
          {/* Col 1: Brand & Contact (300px in Figma) */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="text-[22px] font-heading font-bold tracking-tight text-white">
              DEWI JATENG
            </h3>
            <p className="text-sm text-white/60 leading-[1.7] max-w-sm font-normal">
              Platform digital transparansi dana desa dan pelaporan fasilitas wisata di Jawa Tengah.
            </p>
            <div className="space-y-2 pt-2 text-[13px] text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white/60 shrink-0" />
                <span>Jawa Tengah, Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/60 shrink-0" />
                <a
                  href="mailto:dewijateng@jatengprov.go.id"
                  className="hover:text-white transition-colors"
                >
                  dewijateng@jatengprov.go.id
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/60 shrink-0" />
                <a href="tel:+6285819997505" className="hover:text-white transition-colors">
                  +62 858-1999-7505
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Navigasi */}
          <div className="lg:col-span-3 lg:pl-6 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Navigasi
            </h4>
            <ul className="space-y-3.5 text-sm text-white/60">
              <li>
                <Link href="/" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Home className="w-4 h-4 text-white/60" />
                  <span>Beranda</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/transparansi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Compass className="w-4 h-4 text-white/60" />
                  <span>Jelajah Desa Wisata</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/lapor"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 text-white/60" />
                  <span>Telusuri Laporan</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/transparansi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <BarChart2 className="w-4 h-4 text-white/60" />
                  <span>Transparansi Dana</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/edukasi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-white/60" />
                  <span>Edukasi &amp; Panduan</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Layanan */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Layanan
            </h4>
            <ul className="space-y-3.5 text-sm text-white/60">
              <li>
                <Link href="/lapor" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Search className="w-4 h-4 text-white/60" />
                  <span>Telusur Aduan</span>
                </Link>
              </li>
              <li>
                <a
                  href="/#buat-laporan"
                  className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-white/60" />
                  <span>Buat Laporan</span>
                </a>
              </li>
              <li>
                <Link href="/transparansi" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Activity className="w-4 h-4 text-white/60" />
                  <span>Statistik</span>
                </Link>
              </li>
              <li>
                <Link href="/" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Info className="w-4 h-4 text-white/60" />
                  <span>Tentang Platform</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Ikuti Kami */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Ikuti Kami
            </h4>
            <div className="space-y-3.5 text-sm text-white/60">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <span>Instagram</span>
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Youtube className="w-4 h-4 text-white" />
                </div>
                <span>YouTube</span>
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Twitter className="w-4 h-4 text-white" />
                </div>
                <span>Twitter / X</span>
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between text-[13px] text-white/40 gap-3">
          <p>© 2024 – 2026 Pemerintah Provinsi Jawa Tengah. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-5">
            <Link href="/edukasi" className="hover:text-white/70 transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/edukasi" className="hover:text-white/70 transition-colors">
              Syarat Penggunaan
            </Link>
            <Link href="/edukasi" className="hover:text-white/70 transition-colors">
              Aksesibilitas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
