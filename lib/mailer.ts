// ==============================================================================
// DEWI JATENG - Pengiriman email autentikasi
//
// Transport aktif saat ini: MODE DEMO. Email tidak benar-benar dikirim ke inbox;
// tautan penting ditulis ke log server dan dikembalikan ke pemanggil supaya bisa
// ditampilkan di layar ("Buka tautan — mode demo").
//
// Untuk mengganti ke SMTP sungguhan (nanti): isi env SMTP_HOST/SMTP_PORT/
// SMTP_USER/SMTP_PASS, lalu ganti isi sendMail() dengan nodemailer, dan set
// DEMO_MAIL=false agar tautan tidak lagi dikembalikan ke klien. Antarmuka
// pemanggil tidak perlu berubah.
// ==============================================================================

export interface SendMailInput {
  to: string;
  subject: string;
  /** Judul besar di badan email. */
  heading: string;
  /** Paragraf penjelas. */
  body: string;
  /** Tautan aksi utama (opsional). */
  actionUrl?: string;
  actionLabel?: string;
  /** Catatan kecil di bawah, mis. masa berlaku tautan. */
  footnote?: string;
}

export interface SendMailResult {
  delivered: boolean;
  /**
   * Hanya terisi di mode demo: tautan yang seharusnya dibuka penerima,
   * supaya alur bisa diuji tanpa SMTP.
   */
  devLink?: string;
}

function renderHtml(input: SendMailInput): string {
  const action = input.actionUrl
    ? `<p style="margin:24px 0"><a href="${input.actionUrl}" style="background:#0D2453;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">${input.actionLabel || 'Buka tautan'}</a></p><p style="color:#64748B;font-size:12px;word-break:break-all">${input.actionUrl}</p>`
    : '';
  return `<div style="font-family:Inter,Arial,sans-serif;color:#0D2453;max-width:560px">
  <h1 style="font-size:20px">${input.heading}</h1>
  <p style="color:#475569;font-size:14px;line-height:1.6">${input.body}</p>
  ${action}
  ${input.footnote ? `<p style="color:#64748B;font-size:12px">${input.footnote}</p>` : ''}
  <hr style="border:none;border-top:1px solid #E6ECF5;margin:24px 0" />
  <p style="color:#64748B;font-size:11px">DEWI JATENG · Ruang Admin Dinas</p>
</div>`;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const html = renderHtml(input);

  // ponytail: mode demo — tidak ada SMTP. Tautan dicatat agar bisa diuji.
  console.log(
    `[mailer:demo] -> ${input.to} | ${input.subject}` +
      (input.actionUrl ? ` | ${input.actionUrl}` : '')
  );

  if (process.env.DEMO_MAIL === 'false') {
    // Demo dimatikan manual (mis. setelah SMTP dipasang): jangan bocorkan tautan.
    console.warn('[mailer] mode demo dimatikan; email tidak terkirim.');
    return { delivered: false };
  }

  void html;
  return { delivered: false, devLink: input.actionUrl };
}
