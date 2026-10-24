import type { ComponentType } from 'react';
import { accessRoutes } from '../features/access/routes';
import { AccessPage } from '../pages/AccessPage';
import { InvestigatePage } from '../pages/InvestigatePage';
import { OverviewPage } from '../pages/OverviewPage';

type NavigationRoute = {
  path: string;
  label: string;
  Page: ComponentType;
  children?: readonly { path: string; Page: ComponentType }[];
};

export const navigation: readonly NavigationRoute[] = [
  { path: '/', label: 'Overview', Page: OverviewPage },
  { path: '/access', label: 'Access', Page: AccessPage, children: accessRoutes },
  { path: '/investigate', label: 'Investigate', Page: InvestigatePage },
] as const;
