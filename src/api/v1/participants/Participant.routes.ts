import { Router } from "express";
import participantController from "./Participants.controller";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware";
import { participantLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// Create Participant (with registration rate limiter)
router.post(
  "/participant/create",
  participantLimiter,
  (req, res) => participantController.createParticipant(req, res),
);
router.post(
  "/participants",
  participantLimiter,
  (req, res) => participantController.createParticipant(req, res),
);

// Fetch All Participants (Public)
router.get("/participant/get", (req, res) => participantController.getAllParticipants(req, res));
router.get("/participants", (req, res) => participantController.getAllParticipants(req, res));
router.get("/participants/get", (req, res) => participantController.getAllParticipants(req, res));

// Fetch Participant by Ticket ID (Public)
router.get("/participant/:ticketId", (req, res) =>
  participantController.getParticipantByTicketId(req, res),
);
router.get("/participants/:ticketId", (req, res) =>
  participantController.getParticipantByTicketId(req, res),
);

// Update Participant by Ticket ID (SUPER_ADMIN & ADMIN only)
router.put(
  "/participant/:ticketId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => participantController.updateParticipant(req, res),
);
router.put(
  "/participants/:ticketId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => participantController.updateParticipant(req, res),
);
router.patch(
  "/participant/:ticketId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => participantController.updateParticipant(req, res),
);
router.patch(
  "/participants/:ticketId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => participantController.updateParticipant(req, res),
);

export { router as ParticipantRoutes };
export default router;
