import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { useUiStore } from '../../stores/uiStore';

export function AppShell({ children }: { children: ReactNode }) {
  const { mobileSidebarOpen, closeMobileSidebar } = useUiStore();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />
      <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  );
}
