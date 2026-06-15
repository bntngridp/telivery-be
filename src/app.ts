import "./config/env";
import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/product/product.routes";
import buyerStoreRoutes from "./modules/store/store.routes";
import orderSellerRoutes from "./modules/order/order.routes";
import buyerOrderRoutes from "./modules/order/buyer.order.routes";
import buyerProductRoutes from "./modules/product/buyer.routes";
import buyerProfileRoutes from "./modules/buyer/buyer.routes";
import partnerRoutes from "./modules/partner/partner.routes";
import paymentRoutes from "./modules/payment/payment.routes";
import {
  buyerRouter as serviceBuyerRouter,
  sellerRouter as serviceSellerRouter,
} from "./modules/service/service.routes";
import {
  buyerRouter as notifBuyerRouter,
  sellerRouter as notifSellerRouter,
} from "./modules/notification/notification.routes";
import cartRoutes from "./modules/cart/cart.routes";
import checkoutRoutes from "./modules/checkout/checkout.routes";
import adminRoutes from "./modules/admin/admin.routes";
import alamatRoutes from "./modules/alamat/alamat.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { prisma } from "./config/prisma";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const globalWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak request. Coba lagi dalam 15 menit.",
    error: "TOO_MANY_REQUESTS",
  },
});

const documentsDir = path.join(__dirname, "..", "documents");
app.use(
  "/documents",
  express.static(documentsDir, {
    maxAge: "7d",
    etag: true,
    index: false,
  }),
);

app.get("/", (_req, res) => {
  res.send("Welcome to the Cheva Telivery API!");
});

app.get("/health", async (_req, res) => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Unknown DB error";
  }

  const statusCode = dbStatus === "connected" ? 200 : 503;
  res.status(statusCode).json({
    success: dbStatus === "connected",
    status: statusCode === 200 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
    ...(dbError ? { databaseError: dbError } : {}),
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/docs")) {
    next();
    return;
  }
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    globalWriteLimiter(req, res, next);
  } else {
    next();
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/buyer/products", buyerProductRoutes);
app.use("/api/buyer/stores", buyerStoreRoutes);
app.use("/api/buyer/orders", buyerOrderRoutes);
app.use("/api/buyer/cart", cartRoutes);
app.use("/api/buyer/checkout", checkoutRoutes);
app.use("/api/buyer/notifications", notifBuyerRouter);
app.use("/api/buyer", buyerProfileRoutes);
app.use("/api/buyer/alamat", alamatRoutes);
app.use("/api/seller/orders", orderSellerRoutes);
app.use("/api/seller", partnerRoutes);
app.use("/api/seller/notifications", notifSellerRouter);
app.use("/api/payments", paymentRoutes);
// Midtrans webhook needs its own router (raw body, no JWT). Mount it
// BEFORE the global express.json so we can verify the exact bytes.
import { webhookRouter as paymentWebhookRouter } from "./modules/payment/payment.routes";
app.use("/api/payments/midtrans", paymentWebhookRouter);
app.use("/api/service/seller", serviceSellerRouter);
app.use("/api/service/buyer", serviceBuyerRouter);
app.use("/api/admin", adminRoutes);

// Swagger docs (before notFoundHandler so 404 doesn't catch these)
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Cheva-Telivery API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.use(notFoundHandler);
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    errorHandler(err, req, res, next);
  },
);

export default app;
