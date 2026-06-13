import axios from 'axios';
import { env, isDevelopment } from '../../config/env';

export interface OtpDispatchResult {
    delivered: boolean;
    channel: 'fonnte' | 'twilio' | 'log';
    error?: string;
}

/**
 * Kirim OTP ke nomor telepon via gateway eksternal.
 *
 * Mode operasi (dipilih via env):
 * - OTP_DRY_RUN=true (default) : hanya console.log. Cocok untuk dev / test.
 * - OTP_DRY_RUN=false + OTP_GATEWAY_URL=...: panggil HTTP POST ke gateway.
 *
 * Contoh integrasi Fonnte (Indonesia):
 *   POST https://api.fonnte.com/send
 *   Headers: { Authorization: <OTP_GATEWAY_TOKEN> }
 *   Body:    { target: phone, message: "Kode OTP Anda: 12345", countryCode: '62' }
 *
 * Contoh integrasi Twilio:
 *   POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
 */
export async function sendOtp(phone: string, otp: string): Promise<OtpDispatchResult> {
    const message = `Kode OTP Cheva-Telivery Anda: ${otp}. Berlaku 5 menit. Jangan berikan ke siapapun.`;
    const target = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;

    if (env.OTP_DRY_RUN || !env.OTP_GATEWAY_URL) {
        if (isDevelopment) {
            // eslint-disable-next-line no-console
            console.log(`[OTP-DRY-RUN] -> ${target} : ${message}`);
        }
        return { delivered: true, channel: 'log' };
    }

    try {
        const isFonnte = env.OTP_GATEWAY_URL.includes('fonnte.com');

        if (isFonnte) {
            const response = await axios.post(
                env.OTP_GATEWAY_URL,
                { target, message, countryCode: '62' },
                {
                    headers: { Authorization: env.OTP_GATEWAY_TOKEN },
                    timeout: 10_000,
                },
            );
            const ok = response.status >= 200 && response.status < 300;
            return { delivered: ok, channel: 'fonnte', error: ok ? undefined : `HTTP ${response.status}` };
        }

        // Generic gateway: POST { phone, otp, message }
        const response = await axios.post(
            env.OTP_GATEWAY_URL,
            { phone: target, otp, message },
            {
                headers: { Authorization: `Bearer ${env.OTP_GATEWAY_TOKEN}` },
                timeout: 10_000,
            },
        );
        const ok = response.status >= 200 && response.status < 300;
        return { delivered: ok, channel: 'twilio', error: ok ? undefined : `HTTP ${response.status}` };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        // eslint-disable-next-line no-console
        console.error('[OTP-SEND-FAILED]', message);
        return { delivered: false, channel: 'fonnte', error: message };
    }
}
