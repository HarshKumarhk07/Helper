import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import {
  createTicket,
  listMyTickets,
  listAllTickets,
  getTicket,
  addMessage,
  updateTicketStatus,
} from '../controllers/supportController.js';

const router = Router();

router.use(requireAuth);

router.post('/', createTicket);
router.get('/mine', listMyTickets);
router.get('/', requireRole(ROLES.ADMIN, ROLES.MANAGER), listAllTickets);
router.get('/:id', getTicket);
router.post('/:id/messages', addMessage);
router.patch('/:id/status', requireRole(ROLES.ADMIN, ROLES.MANAGER), updateTicketStatus);

export default router;
