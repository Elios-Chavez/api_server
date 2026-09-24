import type { NextFunction, Request, Response } from 'express';
import { getDemandAnalytics } from '../services/demandService.js';

export async function demand(request: Request, response: Response, next: NextFunction) { try { response.json(await getDemandAnalytics({ period: request.query.period, from: request.query.from, to: request.query.to })); } catch (error) { next(error); } }
