import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { TeamConstants } from "./team.constants";
import { TeamValidator } from "./team.validator";
import { TeamController } from "./team.controller";

/**
 * GDG Ranchi DevFest 2026 - Team Router
 */
export class TeamRouter {
  private readonly router: Router;
  private readonly teamController: TeamController;

  constructor(teamController: TeamController = new TeamController()) {
    this.router = Router();
    this.teamController = teamController;
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get(TeamConstants.ROUTES.ROOT, this.teamController.LIST);
    this.router.post(
      TeamConstants.ROUTES.ROOT,
      authenticate,
      TeamValidator.VALIDATE_CREATE,
      this.teamController.CREATE,
    );
    this.router.post(
      TeamConstants.ROUTES.JOIN,
      authenticate,
      TeamValidator.VALIDATE_JOIN,
      this.teamController.JOIN,
    );
    this.router.get(
      TeamConstants.ROUTES.BY_ID,
      TeamValidator.VALIDATE_PARAMS_ID,
      this.teamController.GET_DETAILS,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const teamRouter = new TeamRouter().getRouter();
export default teamRouter;
