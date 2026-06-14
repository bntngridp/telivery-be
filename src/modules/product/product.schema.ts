import { z } from "zod";

export const createProductSchema = z.object({
  nama: z
    .string({
      required_error: "Nama produk wajib diisi",
      invalid_type_error: "Nama produk harus berupa text",
    })
    .min(1, "Nama produk tidak boleh kosong"),

  harga: z
    .string()
    .or(z.number())
    .transform(Number)
    .pipe(
      z
        .number({
          required_error: "Harga produk wajib diisi",
          invalid_type_error: "Harga harus berupa angka",
        })
        .positive("Harga harus lebih dari 0"),
    ),

  stok: z
    .string()
    .or(z.number())
    .transform(Number)
    .pipe(
      z
        .number({
          required_error: "Stok produk wajib diisi",
          invalid_type_error: "Stok harus berupa angka",
        })
        .min(0, "Stok tidak boleh negatif"),
    ),

  kategori: z.enum(["MAKANAN_MINUMAN", "AIR_GALON", "LAUNDRY"], {
    required_error: "Kategori produk wajib diisi",
    invalid_type_error: "Kategori tidak valid",
  }),
});

export const updateProductSchema = z.object({
  nama: z
    .string({
      invalid_type_error: "Nama produk harus berupa text",
    })
    .min(1, "Nama produk tidak boleh kosong")
    .optional(),

  deskripsi: z
    .string({
      invalid_type_error: "Deskripsi produk harus berupa text",
    })
    .optional(),

  harga: z
    .string()
    .or(z.number())
    .transform(Number)
    .pipe(
      z
        .number({
          invalid_type_error: "Harga harus berupa angka",
        })
        .positive("Harga harus lebih dari 0"),
    )
    .optional(),

  stok: z
    .string()
    .or(z.number())
    .transform(Number)
    .pipe(
      z
        .number({
          invalid_type_error: "Stok harus berupa angka",
        })
        .min(0, "Stok tidak boleh negatif"),
    )
    .optional(),

  kategori: z
    .enum(["MAKANAN_MINUMAN", "AIR_GALON", "LAUNDRY"], {
      invalid_type_error: "Kategori tidak valid",
    })
    .optional(),
});

export const updateStockSchema = z.object({
  stok: z
    .string()
    .or(z.number())
    .transform(Number)
    .pipe(
      z
        .number({
          required_error: "Stok produk wajib diisi",
          invalid_type_error: "Stok harus berupa angka",
        })
        .min(0, "Stok tidak boleh negatif"),
    ),
});
