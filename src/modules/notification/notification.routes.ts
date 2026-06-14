import { Router } from "express";
import {
  buyerNotificationController,
  sellerNotificationController,
} from "./notification.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";

const buyerRouter = Router();
const sellerRouter = Router();

buyerRouter.use(jwtMiddleware);
buyerRouter.get("/", buyerNotificationController.list);
buyerRouter.get("/unread-count", buyerNotificationController.unreadCount);
buyerRouter.patch("/:id/read", buyerNotificationController.markRead);
buyerRouter.patch("/read-all", buyerNotificationController.markAllRead);
buyerRouter.delete("/:id", buyerNotificationController.delete);

sellerRouter.use(jwtMiddleware);
sellerRouter.get("/", sellerNotificationController.list);
sellerRouter.get("/unread-count", sellerNotificationController.unreadCount);
sellerRouter.patch("/:id/read", sellerNotificationController.markRead);
sellerRouter.patch("/read-all", sellerNotificationController.markAllRead);
sellerRouter.delete("/:id", sellerNotificationController.delete);

export { buyerRouter, sellerRouter };
