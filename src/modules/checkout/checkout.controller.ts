import { Request, Response } from "express";
import { checkoutService } from "./checkout.service";
import { checkoutSchema } from "./checkout.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { created } from "../../utils/response";
import { UnauthorizedError } from "../../utils/errors";

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai pembeli");
  return id;
}

export const checkoutController = {
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const data = checkoutSchema.parse(req.body);
    const orders = await checkoutService.checkoutFromCart(userId, data);
    return created(res, "Checkout berhasil", orders);
  }),
};
