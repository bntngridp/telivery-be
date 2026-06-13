import { Router } from 'express';
import { serviceController } from './service.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const sellerRouter = Router();
const buyerRouter = Router();

sellerRouter.use(jwtMiddleware);
sellerRouter.post('/', serviceController.create);
sellerRouter.get('/', serviceController.listBySeller);
sellerRouter.get('/:id', serviceController.getById);
sellerRouter.put('/:id', serviceController.update);
sellerRouter.patch('/:id', serviceController.update);
sellerRouter.delete('/:id', serviceController.delete);

buyerRouter.get('/store/:storeId', serviceController.listByStore);

export { sellerRouter, buyerRouter };
