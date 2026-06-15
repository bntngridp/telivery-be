import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const apisGlobs = [
  path.join(__dirname, "../modules/**/*.controller.ts"),
  path.join(__dirname, "../docs/schemas/*.ts"),
  path.join(__dirname, "../modules/**/*.routes.ts"),
];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Cheva-Telivery API",
      version: "1.0.0",
      description:
        "Backend API untuk marketplace delivery kampus. Auth via JWT bearer.",
      contact: { name: "Cheva Telivery Team", email: "dev@telivery.local" },
      license: { name: "MIT" },
    },
    servers: [
      { url: "http://localhost:3000", description: "Local dev" },
      { url: "https://api.telivery.app", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      parameters: {
        IdParam: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
        },
      },
      responses: {
        Unauthorized: {
          description: "Token tidak ada / tidak valid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource tidak ditemukan",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        BadRequest: {
          description: "Validasi gagal",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Login, register, OTP, refresh token" },
      { name: "Order", description: "Pesanan pembeli & penjual" },
      { name: "Product" },
      { name: "Cart" },
      { name: "Checkout" },
      { name: "Payment", description: "Midtrans Snap + manual receipt" },
      { name: "Notification" },
      { name: "Store" },
      { name: "Service" },
      { name: "Buyer Profile" },
      { name: "Admin" },
    ],
  },
  apis: apisGlobs,
};

export const swaggerSpec = swaggerJsdoc(options);
