// Admin 051 prototype: fixed data for the account area. Invented for the layout; not real fields.
export type EnvironmentRow = { id: string; name: 'Sandbox' | 'Production'; issuer: string; agents: number };
export type WorkspaceRow = {
  tenantId: string;
  name: string;
  role: 'Admin';
  createdAt: string;
  environments: EnvironmentRow[];
};

const origin = 'https://app.xokepoint.localhost';
const env = (tenantId: string, id: string, name: EnvironmentRow['name'], agents: number): EnvironmentRow => ({
  id, name, agents, issuer: `${origin}/as/${tenantId}/${id}`,
});

export const account = { email: "beatriz@acme.test", name: "Beatriz Souza" };

export const workspaces: WorkspaceRow[] = [
  {
    tenantId: '7f3c2a10-4b8e-4d21-9a63-0c5e1f2d8b41', name: 'Acme', role: 'Admin', createdAt: '2026-10-24',
    environments: [
      env('7f3c2a10-4b8e-4d21-9a63-0c5e1f2d8b41', 'b21e9d04-6a7f-4c3b-8e15-2f9a0d6c7e88', 'Sandbox', 4),
      env('7f3c2a10-4b8e-4d21-9a63-0c5e1f2d8b41', 'e8a45c71-0d3b-4f92-b6a8-91c2e7f05d13', 'Production', 2),
    ],
  },
  {
    tenantId: '2d9b6e53-8c14-4a7f-b0e2-6f31a9c4d705', name: 'Acme Research', role: 'Admin', createdAt: '2026-11-03',
    environments: [
      env('2d9b6e53-8c14-4a7f-b0e2-6f31a9c4d705', '5c07f2e9-1b6d-4e83-a49f-d8e2b3a61f70', 'Sandbox', 1),
      env('2d9b6e53-8c14-4a7f-b0e2-6f31a9c4d705', '91d4a8b6-3e2f-4c05-8d7a-0b6f5e9c2a14', 'Production', 0),
    ],
  },
];
