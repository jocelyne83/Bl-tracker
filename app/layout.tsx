'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/componentes/sidebar';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="es">
      <body className="bg-[#f0f2f8] text-[#1e1e38] antialiased min-h-screen">
        <div className="flex min-h-screen w-full overflow-x-hidden">
          {!isLoginPage && <Sidebar />}
          
          {/* pt-20 para espacio de la barra móvil, md:pt-8 md:pl-72 para dejar espacio al Sidebar en escritorio */}
          <main className="flex-1 w-full pt-20 pb-8 px-4 sm:px-6 md:pt-8 md:pl-72 md:pr-8 min-w-0 overflow-y-auto bg-[#f0f2f8]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}