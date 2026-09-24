import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnReconnect: true, refetchOnWindowFocus: true, staleTime: 30000 }, mutations: { retry: 0 } } });
