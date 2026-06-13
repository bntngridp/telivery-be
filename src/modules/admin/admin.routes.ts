import { Router } from 'express';
import { adminController } from './admin.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);

router.get('/stores/pending', adminController.listPendingStores);
router.patch('/stores/:id/approve', adminController.approveStore);
router.patch('/stores/:id/reject', adminController.rejectStore);

export default router;
