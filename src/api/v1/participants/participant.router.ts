import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorizeRoles } from "../../../middleware/role.middleware";
import { ParticipantConstants } from "./participant.constants";
import { ParticipantValidator } from "./participant.validator";
import { ParticipantController } from "./participant.controller";

/**
 * GDG Ranchi DevFest 2026 - Participant Router
 */
export class ParticipantRouter {
  private readonly router: Router;
  private readonly participantController: ParticipantController;

  constructor(participantController: ParticipantController = new ParticipantController()) {
    this.router = Router();
    this.participantController = participantController;
    this.initRoutes();
  }

  private initRoutes(): void {
    // Current Authenticated Participant Endpoints
    this.router.get(
      ParticipantConstants.ROUTES.ME,
      authenticate,
      this.participantController.GET_MY_PROFILE,
    );

    this.router.patch(
      ParticipantConstants.ROUTES.ME,
      authenticate,
      ParticipantValidator.VALIDATE_UPDATE_PROFILE,
      this.participantController.UPDATE_MY_PROFILE,
    );

    this.router.get(
      ParticipantConstants.ROUTES.ME_GAMES,
      authenticate,
      this.participantController.GET_MY_GAMES,
    );

    this.router.get(
      ParticipantConstants.ROUTES.ME_SCORES,
      authenticate,
      this.participantController.GET_MY_SCORES,
    );

    this.router.get(
      ParticipantConstants.ROUTES.ME_TEAM,
      authenticate,
      this.participantController.GET_MY_TEAM,
    );

    // Administrative Participant Management Endpoints
    this.router.get(
      ParticipantConstants.ROUTES.ROOT,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      ParticipantValidator.VALIDATE_FILTER,
      this.participantController.LIST_ALL,
    );

    this.router.get(
      ParticipantConstants.ROUTES.BY_ID,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      ParticipantValidator.VALIDATE_PARAMS_ID,
      this.participantController.GET_BY_ID,
    );

    this.router.patch(
      ParticipantConstants.ROUTES.STATUS,
      authenticate,
      authorizeRoles("SUPER_ADMIN"),
      ParticipantValidator.VALIDATE_PARAMS_ID,
      ParticipantValidator.VALIDATE_UPDATE_STATUS,
      this.participantController.UPDATE_STATUS,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export const participantRouter = new ParticipantRouter().getRouter();
export default participantRouter;
