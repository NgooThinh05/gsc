import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, me);

export default router;
