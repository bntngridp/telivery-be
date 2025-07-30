import { PrismaClient } from "@prisma/client";
import { RegisterBuyerDto } from "./auth.schema";

const prisma = new PrismaClient();

export const authService = {
    async registerBuyer(data: RegisterBuyerDto) {
        const existing = await prisma.pembeli.findFirst({
            where: {
                OR: [
                    { phone_number: data.phoneNumber },
                    { email: data.email }
                ]
            }
        });


        if (existing) {
            throw new Error("Nomor atau email sudah terdaftar.");
        }

        // Simpan data pembeli baru
        const newBuyer = await prisma.pembeli.create({
            data: {
                full_name: data.fullName,
                phone_number: data.phoneNumber,
                delivery_address: data.address,
                birth_date: new Date(data.birthDate),
                domicile: data.domicile,
                faculty: data.faculty,
                major: data.major,
                email: data.email,
                // password: ... (jika ada)
            }
        });

        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        console.log(`OTP ${otp} dikirim ke ${data.phoneNumber}`);

        // TODO: Simpan OTP ke Redis atau tabel otp_verify

        return {
            message: "Register berhasil. OTP dikirim ke nomor kamu.",
            otp,
        };
    }
};
