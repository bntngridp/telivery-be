import { Router } from "express";
import {
  listAlamat,
  getAlamat,
  createAlamat,
  updateAlamat,
  deleteAlamat,
  setPrimary,
} from "./alamat.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";

const router = Router();

router.get("/", jwtMiddleware, listAlamat);
router.get("/:id", jwtMiddleware, getAlamat);
router.post("/", jwtMiddleware, createAlamat);
router.patch("/:id", jwtMiddleware, updateAlamat);
router.delete("/:id", jwtMiddleware, deleteAlamat);
router.patch("/:id/primary", jwtMiddleware, setPrimary);

export default router;
