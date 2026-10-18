import { Router } from "express";
import gameController from "./Games.Controller";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware";

const router = Router();

// Create Game (SUPER_ADMIN & ADMIN)
router.post("/game/create", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.createGame(req, res),
);
router.post("/games", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.createGame(req, res),
);
router.post("/games/create", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.createGame(req, res),
);

// Fetch All Games (Public)
router.get("/game/get", (req, res) => gameController.fetchAllGames(req, res));
router.get("/games", (req, res) => gameController.fetchAllGames(req, res));
router.get("/games/get", (req, res) => gameController.fetchAllGames(req, res));

// Fetch Game by Name (Public)
router.get("/game/name/:name", (req, res) => gameController.getGameByName(req, res));
router.get("/games/name/:name", (req, res) => gameController.getGameByName(req, res));

// Fetch Game by ID (Public)
router.get("/game/get/:id", (req, res) => gameController.getGameById(req, res));
router.get("/game/:id", (req, res) => gameController.getGameById(req, res));
router.get("/games/:id", (req, res) => gameController.getGameById(req, res));

// Activate Game by ID (SUPER_ADMIN & ADMIN)
router.patch(
  "/game/:id/activate",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => gameController.activateGame(req, res),
);
router.patch(
  "/games/:id/activate",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => gameController.activateGame(req, res),
);

// Close Game by ID (SUPER_ADMIN & ADMIN)
router.patch("/game/:id/close", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.closeGame(req, res),
);
router.patch("/games/:id/close", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.closeGame(req, res),
);

// Update Game by ID (SUPER_ADMIN & ADMIN) - PATCH & PUT
router.patch("/game/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.updateGame(req, res),
);
router.put("/game/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.updateGame(req, res),
);
router.patch("/games/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.updateGame(req, res),
);
router.put("/games/:id", authenticate, authorizeRoles("SUPER_ADMIN", "ADMIN"), (req, res) =>
  gameController.updateGame(req, res),
);

export { router as GameRoutes };

