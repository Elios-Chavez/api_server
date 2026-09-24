import type { NextFunction, Request, Response } from 'express';
import { ingestObservation } from '../services/businessService.js';

export async function observations(request: Request, response: Response, next: NextFunction) {
  try {
    const result = await ingestObservation(request.body);
    response.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}
