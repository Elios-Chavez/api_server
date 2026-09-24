import type { EdgeObservation } from '../../types/domain.js';

/** Contrato agnóstico para cámaras, sensores o hardware existente. */
export interface PhysicalObservationSource {
  normalize(payload: unknown): EdgeObservation;
}
