import { z } from 'zod';

export const registerSchema = z.object({
  nama_lengkap: z.string().min(1),
  nomor_hp: z.string().min(10),
  tanggal_lahir: z.string(), // ISO date string
  domisili: z.string().min(1),
  fakultas: z.string().min(1),
  prodi: z.string().min(1),
  alamat_utama: z.string().min(1),
  foto: z.string().optional(),
  password: z.string().min(6)
});

