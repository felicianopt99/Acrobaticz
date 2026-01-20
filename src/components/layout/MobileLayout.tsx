import type React from 'react';
import { MobileLayoutClient } from '@/components/layout/MobileLayoutClient';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return <MobileLayoutClient>{children}</MobileLayoutClient>;
}
