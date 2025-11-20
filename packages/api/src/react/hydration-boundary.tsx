import {
  dehydrate,
  HydrationBoundary as ReactQueryHydrationBoundary,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { api } from './server';

export async function HydrationBoundary(props: PropsWithChildren) {
  const trpc = await api();
  const dehydratedState = dehydrate(trpc.queryClient);

  return (
    <ReactQueryHydrationBoundary state={dehydratedState}>
      {props.children}
    </ReactQueryHydrationBoundary>
  );
}
