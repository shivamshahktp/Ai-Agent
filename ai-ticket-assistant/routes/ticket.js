import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { createTicket, getTicket, getTickets, updateTicketStatus, deleteTicket } from "../controllers/ticket.js";

const router = express.Router();

router.get("/", authenticate, getTickets);
router.get("/:id", authenticate, getTicket);
router.post("/", authenticate, createTicket);
router.patch("/:id/status", authenticate, updateTicketStatus);
router.delete("/:id", authenticate, deleteTicket);

export default router;