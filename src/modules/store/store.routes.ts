import { Router } from 'express';
import { storeController } from './store.controller';

const router = Router();

router.get('/', storeController.getAllStores);
router.get('/popular', storeController.getPopularStores);
router.get('/recommendations', storeController.getStoreRecommendations);
router.get('/search', storeController.searchStores);
router.get('/category/:kategori', storeController.getStoresByCategory);
router.get('/:id/products', storeController.getStoreProducts);
router.get('/:id', storeController.getStoreById);

export default router;
