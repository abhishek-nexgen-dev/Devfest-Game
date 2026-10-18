import { Router } from "express";
import participantController from "./Participants.controller";
import authenticate, { authorizeRoles, optionalAuth } from "../../../middleware/auth.middleware";
import { participantLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// Participant Creation (Public with registration rate limiter)
router.post("/participant/create", participantLimiter, (req, res) =>
  participantController.createParticipant(req, res),
);
router.post("/participants", participantLimiter, (req, res) =>
  participantController.createParticipant(req, res),
);

// Public Join Game
router.post("/participant/join-game", optionalAuth, (req, res) =>
  participantController.joinGame(req, res),
);
router.post("/participants/join-game", optionalAuth, (req, res) =>
  participantController.joinGame(req, res),
);

// Admin Game Score Update (SUPER_ADMIN & ADMIN)
router.patch(
  "/participants/update/game-score",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => participantController.updateGameScore(req, res),
);
router.patch(
  "/participant/update/game-score",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => participantController.updateGameScore(req, res),
);

// Fetch All Participants (Public)
router.get("/participants/get", (req, res) => participantController.getAllParticipants(req, res));
router.get("/participant/get", (req, res) => participantController.getAllParticipants(req, res));
router.get("/participants", (req, res) => participantController.getAllParticipants(req, res));

// Fetch Participant by Ticket ID (Public)
router.get("/participant/:ticketId", (req, res) =>
  participantController.getParticipantByTicketId(req, res),
);
router.get("/participants/:ticketId", (req, res) =>
  participantController.getParticipantByTicketId(req, res),
);

// Update Participant by Ticket ID (PUT, PATCH & POST - optionalAuth delegates to joinGame if unauthenticated)
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
