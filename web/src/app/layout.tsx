import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"]
});

import { ClerkProvider } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: "CarePath Dashboard",
  description: "CarePath Elder Care Dashboard - Warm, Trust, Calm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
        <body>
          <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <Sidebar />
            <main style={{ flex: 1, position: 'relative', overflowX: 'hidden' }}>
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
