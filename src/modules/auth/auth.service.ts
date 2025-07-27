import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function registerUser(data: {
  nama_lengkap: string;
  nomor_hp: string;
  tanggal_lahir: string;
  domisili: string;
  fakultas: string;
  prodi: string;
  alamat_utama: string;
  foto?: string;
  password: string;
}) {
  // Check if nomor_hp already exists
  const existing = await prisma.user.findUnique({ where: { nomor_hp: data.nomor_hp } });
  if (existing) throw new Error('Nomor HP already registered');

  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Generate 5-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const otp_expired_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  const user = await prisma.user.create({
    data: {
      nama_lengkap: data.nama_lengkap,
      nomor_hp: data.nomor_hp,
      tanggal_lahir: new Date(data.tanggal_lahir),
      domisili: data.domisili,
      fakultas: data.fakultas,
      prodi: data.prodi,
      alamat_utama: data.alamat_utama,
      foto: data.foto,
      password: hashedPassword,
      is_verified: false,
      otp,
      otp_expired_at
    }
  });
  // TODO: Send OTP to user's phone number via SMS provider
  return user;
}
