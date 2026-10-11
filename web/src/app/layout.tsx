import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryProvider } from '@/lib/query/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MONVEX — Financial Intelligence',
  description: 'Personal financial intelligence and decision platform',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

import { cookies } from 'next/headers';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const initialSidebarCollapsed = cookieStore.get('monvex-sidebar-collapsed')?.value === 'true';

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var s=localStorage.getItem('monvex-theme');
var p=window.matchMedia('(prefers-color-scheme: dark)').matches;
if(s==='dark'||(!s&&p)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}
else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}
var sc=localStorage.getItem('monvex-sidebar-collapsed');
if(sc!==null){document.cookie='monvex-sidebar-collapsed='+sc+'; path=/; max-age=31536000; SameSite=Lax';}
}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-text-primary font-sans antialiased selection:bg-accent selection:text-white">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ThemeProvider>
                <SidebarProvider initialCollapsed={initialSidebarCollapsed}>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </SidebarProvider>
              </ThemeProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
