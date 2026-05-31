import { Router } from 'express';
import { streamOrderEvents } from '../controllers/events.controller.js';

const router = Router();

router.get('/orders', streamOrderEvents);

export default router;
