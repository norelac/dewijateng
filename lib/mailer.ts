// ==============================================================================
// DEWI JATENG - Pengiriman email autentikasi
//
// Kalau SMTP_HOST/SMTP_USER/SMTP_PASS terisi, email dikirim sungguhan lewat
// nodemailer. Kalau kosong (atau pengiriman gagal), fungsi jatuh ke mode demo:
// tautan dikembalikan ke pemanggil supaya alur verifikasi/reset tidak buntu.
// ==============================================================================

import nodemailer, { type Transporter } from 'nodemailer';

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
   * Terisi saat email tidak benar-benar terkirim (SMTP kosong atau gagal),
   * supaya alur bisa diuji tanpa kotak masuk.
   */
  devLink?: string;
}

let cached: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  if (!cached) {
    const port = Number(process.env.SMTP_PORT || 465);
    cached = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user, pass },
    });
  }
  return cached;
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
  const from =
    process.env.SMTP_FROM || `DEWI JATENG <${process.env.SMTP_USER || 'no-reply@localhost'}>`;
  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[mailer:demo] -> ${input.to} | ${input.subject}` +
        (input.actionUrl ? ` | ${input.actionUrl}` : '')
    );
    return { delivered: false, devLink: input.actionUrl };
  }

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html,
      text: [input.heading, input.body, input.actionUrl, input.footnote]
        .filter(Boolean)
        .join('\n\n'),
    });
    return { delivered: true };
  } catch (err) {
    // Jaring pengaman hari-H: email gagal terkirim, tapi alur tetap bisa lanjut.
    console.error('[mailer] gagal kirim, kembali ke tautan demo:', err);
    return { delivered: false, devLink: input.actionUrl };
  }
}
