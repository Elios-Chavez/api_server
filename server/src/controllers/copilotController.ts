import type { NextFunction, Request, Response } from 'express';
import { askCopilot } from '../copilot/copilotService.js';

export async function ask(request: Request, response: Response, next: NextFunction) {
  try {
    const result = await askCopilot(request.body?.question, request.body?.history);
    response.json(result.response);
  } catch (error) {
    next(error);
  }
}
