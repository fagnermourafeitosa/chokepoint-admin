import { useState } from 'react';
import { createQueryClient } from './query-client';

export function useAppProviders() {
  const [queryClient] = useState(createQueryClient);
  return { queryClient };
}
