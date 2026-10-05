import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { ResultConstants } from "./result.constants";
import { ResultService } from "./result.service";

/**
 * GDG Ranchi DevFest 2026 - Result Controller
 */
export class ResultController {
  private readonly resultService: ResultService;

  constructor(resultService: ResultService = new ResultService()) {
    this.resultService = resultService;
  }

  public UPDATE_SCORE = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminEmail = req.user?.email || "admin@gdgranchi.in";
      const result = await this.resultService.UPDATE_SCORE(adminEmail, req.body);
      sendSuccess(res, result, ResultConstants.MESSAGES.SCORE_UPDATED, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_GAME_RESULTS = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const results = await this.resultService.GET_GAME_RESULTS(req.params.gameId);
      sendSuccess(res, results, ResultConstants.MESSAGES.RESULTS_LISTED, 200);
    } catch (error) {
      next(error);
    }
  };

  public GET_SCORE_LOGS = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const logs = await this.resultService.GET_SCORE_LOGS(req.query.gameId as string);
      sendSuccess(res, logs, ResultConstants.MESSAGES.RESULTS_LISTED, 200);
    } catch (error) {
      next(error);
    }
  };
}
