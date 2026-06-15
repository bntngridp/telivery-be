import { getTransporter, isEmailEnabled } from "../../config/mailer";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";

export type EmailTemplate =
  | "orderAccepted"
  | "orderDelivered"
  | "orderCanceled"
  | "orderCompleted";

function buildTemplate(
  template: EmailTemplate,
  orderId: number,
  reason?: string,
): { subject: string; html: string } {
  switch (template) {
    case "orderAccepted":
      return {
        subject: `Pesanan #${orderId} diterima penjual`,
        html: `<h2>Pesanan Diterima</h2>
<p>Pesanan <b>#${orderId}</b> telah diterima oleh penjual dan akan segera diproses.</p>
<p>Pantau status pesanan Anda di aplikasi Cheva-Telivery.</p>`,
      };
    case "orderDelivered":
      return {
        subject: `Pesanan #${orderId} sedang dikirim`,
        html: `<h2>Pesanan Dikirim</h2>
<p>Pesanan <b>#${orderId}</b> sedang dalam perjalanan menuju Anda.</p>
<p>Mohon ditunggu. Konfirmasi penerimaan setelah pesanan sampai.</p>`,
      };
    case "orderCanceled":
      return {
        subject: `Pesanan #${orderId} dibatalkan`,
        html: `<h2>Pesanan Dibatalkan</h2>
<p>Pesanan <b>#${orderId}</b> dibatalkan${reason ? ` dengan alasan: <i>${reason}</i>` : ""}.</p>
<p>Jika Anda merasa ini keliru, hubungi penjual melalui aplikasi.</p>`,
      };
    case "orderCompleted":
      return {
        subject: `Pesanan #${orderId} selesai`,
        html: `<h2>Pesanan Selesai</h2>
<p>Terima kasih! Pesanan <b>#${orderId}</b> telah selesai. Jangan lupa beri ulasan untuk penilaian penjual.</p>`,
      };
  }
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

export async function sendOrderEmail(opts: {
  orderId: number;
  buyerId: number;
  template: EmailTemplate;
  reason?: string;
}): Promise<SendEmailResult> {
  if (!isEmailEnabled()) {
    return { sent: false, error: "Email disabled (SMTP_HOST kosong)" };
  }
  const buyer = await prisma.pembeli.findUnique({
    where: { user_id: opts.buyerId },
  });
  if (!buyer?.email) {
    return { sent: false, error: "Buyer tidak punya email" };
  }
  const tpl = buildTemplate(opts.template, opts.orderId, opts.reason);
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { sent: false, error: "Transporter tidak tersedia" };
    }
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: buyer.email,
      subject: tpl.subject,
      html: tpl.html,
    });
    return { sent: true };
  } catch (e) {
    return {
      sent: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
