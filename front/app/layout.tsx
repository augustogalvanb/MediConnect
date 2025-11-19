import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
const inter = Inter({ subsets: ['latin'] });
export const metadata: Metadata = {
title: 'MediConnect - Clínica Médica Integral',
description: 'Sistema de gestión de turnos y atención médica',
keywords: ['clínica', 'médica', 'turnos', 'salud', 'telemedicina'],
authors: [{ name: 'MediConnect Team' }],
openGraph: {
title: 'MediConnect - Clínica Médica Integral',
description: 'Sistema de gestión de turnos y atención médica',
type: 'website',
},
};
export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="es" suppressHydrationWarning>
<body className={inter.className}>
<ThemeProvider
       attribute="class"
       defaultTheme="light"
       enableSystem
       disableTransitionOnChange
     >
<AuthProvider>
<ChatProvider>
{children}
<Toaster position="top-right" richColors />
</ChatProvider>
</AuthProvider>
</ThemeProvider>
</body>
</html>
);
}