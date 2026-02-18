import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as transactionService from '../services/transactions';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const summary = await transactionService.getSummary(req.userId!, from, to);
    
    res.json({
      data: {
        income: summary.income,
        expense: summary.expense,
        balance: summary.income - summary.expense,
        period: { from, to },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
