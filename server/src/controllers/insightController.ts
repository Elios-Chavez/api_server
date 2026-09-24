import type { NextFunction, Request, Response } from 'express';
import { getInventoryInsights, runInventoryAgent } from '../agent/inventoryAgent.js';

export async function insights(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await getInventoryInsights());
  } catch (error) {
    next(error);
  }
}

export async function refreshInsights(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await runInventoryAgent());
  } catch (error) {
    next(error);
  }
}
