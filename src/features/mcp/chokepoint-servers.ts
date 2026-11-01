// Layout prototype (Admin A2): servers that use the Chokepoint token auth type (Backend 035).
// The backend does not store this auth type yet, so the prototype keeps it in memory.
const servers = new Set<string>();
export const markChokepointServer = (id: string) => { servers.add(id); };
export const usesChokepointToken = (id: string, name: string) => servers.has(id) || name === 'Local catalog';
