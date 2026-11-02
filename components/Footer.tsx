import Link from 'next/link';
import {
  MapPin,
  Mail,
  Phone,
  Home,
  Compass,
  FileText,
  Coins,
  Search,
  PlusCircle,
  BarChart2,
  Map,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0D2453] text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Contact */}
          <div className="space-y-4">
            <h3 className="text-xl sm:text-[22px] font-heading font-bold tracking-tight text-white">
              DEWI JATENG
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Platform digital transparansi dana desa dan pelaporan fasilitas wisata di Jawa Tengah.
            </p>
            <div className="space-y-2.5 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Jawa Tengah, Indonesia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>[Email resmi pengelola]</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>(024) [Nomor Kontak Resmi]</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigasi */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              NAVIGASI
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li>
                <Link href="/" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>Beranda</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/transparansi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Compass className="w-4 h-4 text-slate-400" />
                  <span>Jelajah Desa Wisata</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#buat-laporan"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Lapor</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/transparansi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Coins className="w-4 h-4 text-slate-400" />
                  <span>Transparansi Dana</span>
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2.5 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Edukasi &amp; Panduan</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Layanan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              LAYANAN
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li>
                <Link
                  href="/#buat-laporan"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span>Telusur Aduan</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#buat-laporan"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-slate-400" />
                  <span>Buat Laporan</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/transparansi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <BarChart2 className="w-4 h-4 text-slate-400" />
                  <span>Statistik</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/transparansi"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Map className="w-4 h-4 text-slate-400" />
                  <span>Peta Situs</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Ikuti Kami */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              IKUTI KAMI
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li>
                <a href="#" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Instagram className="w-4 h-4 text-slate-400" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Youtube className="w-4 h-4 text-slate-400" />
                  <span>YouTube</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Twitter className="w-4 h-4 text-slate-400" />
                  <span>Twitter / X</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Facebook className="w-4 h-4 text-slate-400" />
                  <span>Facebook</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="border-t border-slate-700/60 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>&copy; 2024 &ndash; 2026 Pemerintah Provinsi Jawa Tengah. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Syarat Penggunaan
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Aksesibilitas
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
