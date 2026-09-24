const scenario = process.argv[2] === 'stable' ? 'stable' : 'priority';
const quantity = scenario === 'stable' ? 8 : 6;
const baseUrl = process.env.EDGE_API_URL ?? 'http://127.0.0.1:3001/api';
const payload = { observationId: `sim-${scenario}-${Date.now()}`, zoneId: 'zona-a', sourceId: 'edge-simulator', timestamp: new Date().toISOString(), items: [{ productId: 'producto-a', quantity }] };
const response = await fetch(`${baseUrl}/edge/observations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
console.log(JSON.stringify({ scenario, status: response.status, body: await response.json() }, null, 2));
if (!response.ok) process.exitCode = 1;
