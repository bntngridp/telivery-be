import { Request, Response } from 'express';
import { registerSchema } from './auth.schema';
import { registerUser } from './auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }
    const user = await registerUser(parsed.data);
    res.status(201).json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const { nomor_hp, otp } = req.body;
  if (!nomor_hp || !otp) {
    return res.status(400).json({ error: 'nomor_hp and otp are required' });
  }
  const user = await prisma.user.findUnique({ where: { nomor_hp } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.is_verified) return res.status(400).json({ error: 'User already verified' });
  if (!user.otp || !user.otp_expired_at) return res.status(400).json({ error: 'OTP not generated' });
  if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (user.otp_expired_at < new Date()) return res.status(400).json({ error: 'OTP expired' });

  await prisma.user.update({
    where: { nomor_hp },
    data: { is_verified: true, otp: null, otp_expired_at: null }
  });
  return res.json({ message: 'Phone number verified successfully' });
}
