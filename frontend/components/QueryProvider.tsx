'use client';

import { ReactNode } from 'react';

// Simplified QueryProvider that doesn't require @tanstack/react-query
// Install the library if you need full query functionality: npm install @tanstack/react-query

export default function QueryProvider({ children }: { children: ReactNode }) {
  // Simple passthrough component - replace with actual QueryClientProvider when library is installed
  return <>{children}</>;
}
