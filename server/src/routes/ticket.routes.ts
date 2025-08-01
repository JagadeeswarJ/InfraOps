import { Router } from "express";
import {
    createTicket,
    getTicket,
    getTickets,
    updateTicketStatus,
    assignTicket,
    autoAssignTicket,
    getAvailableTechnicians,
    updateTicket,
    deleteTicket,
    getTicketsByTechnician,
    getCurrentAssignedTickets,
    getTechnicianDashboard,
    getTicketStats,
    getSpamTickets,
    markTicketAsSpam,
    unmarkTicketAsSpam
} from "../controllers/ticket.controller.js";

const router = Router();

// POST /api/tickets - Create a new ticket
router.post('/', createTicket);

// GET /api/tickets - Get all tickets (with optional filters)
router.get('/', getTickets);

// GET /api/tickets/stats - Get ticket statistics
router.get('/stats', getTicketStats);

// GET /api/tickets/technician/:technicianId - Get tickets assigned to technician
router.get('/technician/:technicianId', getTicketsByTechnician);

// GET /api/tickets/technician/:technicianId/current - Get currently assigned tickets (active work)
router.get('/technician/:technicianId/current', getCurrentAssignedTickets);

// GET /api/tickets/technician/:technicianId/dashboard - Get technician dashboard data
router.get('/technician/:technicianId/dashboard', getTechnicianDashboard);

// GET /api/tickets/spam - Get spam tickets (manager only)
router.get('/spam', getSpamTickets);

// POST /api/tickets/:id/mark-spam - Mark ticket as spam
router.post('/:id/mark-spam', markTicketAsSpam);

// POST /api/tickets/:id/unmark-spam - Remove spam flag from ticket
router.post('/:id/unmark-spam', unmarkTicketAsSpam);

// GET /api/tickets/:id - Get ticket by ID
router.get('/:id', getTicket);

// PUT /api/tickets/:id - Update ticket
router.put('/:id', updateTicket);

// PATCH /api/tickets/:id/status - Update ticket status
router.patch('/:id/status', updateTicketStatus);

// PATCH /api/tickets/:id/assign - Assign ticket to technician
router.patch('/:id/assign', assignTicket);

// POST /api/tickets/:id/auto-assign - Auto-assign ticket to best available technician
router.post('/:id/auto-assign', autoAssignTicket);

// GET /api/tickets/:id/available-technicians - Get available technicians for a ticket
router.get('/:id/available-technicians', getAvailableTechnicians);

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', deleteTicket);

export default router;