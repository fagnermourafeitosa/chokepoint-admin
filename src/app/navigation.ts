import { AccessPage } from '../pages/AccessPage';
import { InvestigatePage } from '../pages/InvestigatePage';
import { OverviewPage } from '../pages/OverviewPage';

export const navigation = [
  { path: '/', label: 'Overview', Page: OverviewPage },
  { path: '/access', label: 'Access', Page: AccessPage },
  { path: '/investigate', label: 'Investigate', Page: InvestigatePage },
] as const;
