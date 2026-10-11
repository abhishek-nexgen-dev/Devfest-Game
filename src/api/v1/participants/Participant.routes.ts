import { Router } from "express";
import participantController from "./Participants.controller";
import authenticate, { authorizeRoles, optionalAuth } from "../../../middleware/auth.middleware";
import { participantLimiter } from "../../../middleware/rateLimiter";

const router = Router();


router.post("/participant/create", participantLimiter, (req, res) =>
  participantController.createParticipant(req, res),
);


router.post("/participant/join-game", optionalAuth, (req, res) =>
  participantController.joinGame(req, res),
);



router.patch("/participants/update/game-score", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  participantController.updateGameScore(req, res),
);


router.get("/participants/get", (req, res) => participantController.getAllParticipants(req, res));



router.get("/participant/:ticketId", (req, res) =>
  participantController.getParticipantByTicketId(req, res),
);


router.put("/participant/:ticketId", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  participantController.updateParticipant(req, res),
);


export { router as ParticipantRoutes };
export default router;
