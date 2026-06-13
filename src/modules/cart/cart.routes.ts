import { Router } from 'express';
import { cartController } from './cart.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);
router.post('/items', cartController.add);
router.get('/', cartController.list);
router.patch('/items/:id', cartController.update);
router.delete('/items/:id', cartController.remove);
router.delete('/', cartController.clear);

export default router;
