import { Link, Plug, Shield } from 'lucide-react';

export const accessNavigation = [
  { path: '/access', label: 'Permissions', Icon: Shield },
  { path: '/access/context-sources', label: 'Context sources', Icon: Link },
  { path: '/access/integrations', label: 'Integrations', Icon: Plug },
] as const;
