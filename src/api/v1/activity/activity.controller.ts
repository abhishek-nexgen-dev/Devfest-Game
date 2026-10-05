import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../../utils/response.util";
import { ActivityConstants } from "./activity.constants";
import { ActivityService } from "./activity.service";

/**
 * GDG Ranchi DevFest 2026 - Activity Controller
 */
export class ActivityController {
  private readonly activityService: ActivityService;

  constructor(activityService: ActivityService = new ActivityService()) {
    this.activityService = activityService;
  }

  public LIST_LOGS = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await this.activityService.LIST_LOGS(req.query.userId as string);
      sendSuccess(res, logs, ActivityConstants.MESSAGES.LOGS_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };
}
