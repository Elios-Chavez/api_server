# Integraciones

`edge/` define el contrato agnóstico `PhysicalObservationSource`. El endpoint `/api/edge/observations` recibe observaciones ya normalizadas; una Raspberry, ESP32-CAM u otra fuente podrá implementar el adaptador sin cambiar el dominio.

`pos/` y `erp/` quedan reservados para integraciones futuras. No se implementan conectores ficticios en esta fase: Copiloto se monta sobre esos sistemas y no los reemplaza.
