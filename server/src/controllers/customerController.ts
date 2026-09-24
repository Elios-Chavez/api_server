import type { NextFunction, Request, Response } from 'express';
import { createCustomerSession, getCustomerProducts, askCustomer, CustomerValidationError } from '../customer/customerService.js';
import type { CustomerSource } from '../customer/types.js';

const sources = new Set<CustomerSource>(['tablet', 'kiosk', 'web']);

export async function products(_request: Request, response: Response, next: NextFunction) { try { response.json(await getCustomerProducts()); } catch (error) { next(error); } }
export async function createSession(request: Request, response: Response, next: NextFunction) { try { const source = request.body?.source ?? 'tablet'; if (typeof source !== 'string' || !sources.has(source as CustomerSource)) throw new CustomerValidationError('El origen de la sesión no es válido.'); response.status(201).json(await createCustomerSession(source as CustomerSource)); } catch (error) { next(error); } }
export async function ask(request: Request, response: Response, next: NextFunction) { try { response.status(201).json(await askCustomer(request.body ?? {})); } catch (error) { next(error); } }
