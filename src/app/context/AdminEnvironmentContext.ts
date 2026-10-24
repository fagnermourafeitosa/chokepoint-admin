import { createContext } from 'react';
export type Environment = 'Sandbox' | 'Production';

export const AdminEnvironmentContext = createContext<Environment | null>(null);
