import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorizeRoles } from "../../../middleware/role.middleware";
import { GameConstants } from "./game.constants";
import { GameValidator } from "./game.validator";
import { GameController } from "./game.controller";

/**
 * GDG Ranchi DevFest 2026 - Game Router
 */
export class GameRouter {
  private readonly router: Router;
  private readonly gameController: GameController;

  constructor(gameController: GameController = new GameController()) {
    this.router = Router();
    this.gameController = gameController;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get(GameConstants.ROUTES.ROOT, this.gameController.LIST);
    this.router.get(
      GameConstants.ROUTES.BY_ID,
      GameValidator.VALIDATE_PARAMS_ID,
      this.gameController.GET_BY_ID,
    );

    // Administrative Operations
    this.router.post(
      GameConstants.ROUTES.ROOT,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      GameValidator.VALIDATE_CREATE,
      this.gameController.CREATE,
    );

    this.router.patch(
      GameConstants.ROUTES.BY_ID,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      GameValidator.VALIDATE_PARAMS_ID,
      GameValidator.VALIDATE_UPDATE,
      this.gameController.UPDATE,
    );

    this.router.post(
      GameConstants.ROUTES.ACTIVATE,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      GameValidator.VALIDATE_PARAMS_ID,
      this.gameController.ACTIVATE,
    );

    this.router.post(
      GameConstants.ROUTES.CLOSE,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      GameValidator.VALIDATE_PARAMS_ID,
      this.gameController.CLOSE,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const gameRouter = new GameRouter().getRouter();
export default gameRouter;
