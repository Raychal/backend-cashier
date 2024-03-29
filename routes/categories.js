import express from 'express';
import { index, store } from '../controllers/CategoryController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import role from '../middlewares/role.js';
var router = express.Router();

router.get('/', jwtAuth(), role(['admin', 'cashier']), index);
router.post('/', jwtAuth(), store);

export default router;
