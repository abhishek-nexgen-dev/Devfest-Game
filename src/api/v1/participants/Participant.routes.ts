import { Router } from "express";
import participantController from "./Participants.controller";
import { optionalAuth } from "../../../middleware/auth.middleware";
import { participantLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// ============================================================================
// Participant Creation (Public with registration rate limiter)
// ============================================================================
router.post("/participant/create", participantLimiter, (req, res) =>
  participantController.createParticipant(req, res),
);
router.post("/participants", participantLimiter, (req, res) =>
  participantController.createParticipant(req, res),
);

// ============================================================================
// Public Join Game (Single canonical flow taking { email, ticket_id, game_id } in req.body)
// ============================================================================
router.post("/participants/join-game", optionalAuth, (req, res) =>
  participantController.joinGame(req, res),
);
router.post("/participant/join-game", optionalAuth, (req, res) =>
  participantController.joinGame(req, res),
);

// ============================================================================
// Fetch Participants (Public)
// ============================================================================
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

// ============================================================================
// Update Participant by Ticket ID (PUT & PATCH)
// ============================================================================
// Update Participant by Ticket ID (PUT, PATCH & POST)
// ============================================================================
router.put("/participant/:ticketId", optionalAuth, (req, res) =>
  participantController.updateParticipant(req, res),
);
router.put("/participants/:ticketId", optionalAuth, (req, res) =>
  participantController.updateParticipant(req, res),
);

router.patch("/participant/:ticketId", optionalAuth, (req, res) =>
  participantController.updateParticipant(req, res),
);
router.patch("/participants/:ticketId", optionalAuth, (req, res) =>
  participantController.updateParticipant(req, res),
);

router.post("/participant/:ticketId", optionalAuth, (req, res) =>
  participantController.updateParticipant(req, res),
);
router.post("/participants/:ticketId", optionalAuth, (req, res) =>
  participantController.updateParticipant(req, res),
);

export { router as ParticipantRoutes };
export default router;


