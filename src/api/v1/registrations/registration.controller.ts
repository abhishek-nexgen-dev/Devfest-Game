import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";
import { RegistrationConstants } from "./registration.constants";
import { RegistrationService } from "./registration.service";

/**
 * GDG Ranchi DevFest 2026 - Registration Controller
 */
export class RegistrationController {
  private readonly registrationService: RegistrationService;

  constructor(registrationService: RegistrationService = new RegistrationService()) {
    this.registrationService = registrationService;
  }

  public REGISTER = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const participantId = req.user?.participantId || req.user?.userId;
      if (!participantId) {
        throw new UnauthorizedError();
      }

      const registration = await this.registrationService.REGISTER_FOR_GAME(
        participantId,
        req.body,
      );
      sendSuccess(res, registration, RegistrationConstants.MESSAGES.REGISTER_SUCCESS, 201);
    } catch (error) {
      next(error);
    }
  };

  public LIST_BY_GAME = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await this.registrationService.LIST_BY_GAME(req.params.gameId);
      sendSuccess(res, records, RegistrationConstants.MESSAGES.REGISTRATIONS_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };
}
