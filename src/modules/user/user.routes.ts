import { Router } from 'express';
import * as userController from './user.controller';

const router = Router();

// Test API: Random quote
router.get('/random-quote', userController.getRandomQuote);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;