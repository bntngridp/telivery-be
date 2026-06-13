import { Router } from 'express';
import { partnerController } from './partner.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.get('/profile', jwtMiddleware, partnerController.getProfile);
router.patch('/profile', jwtMiddleware, partnerController.updateProfile);

export default router;
