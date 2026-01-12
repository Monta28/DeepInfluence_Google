
import type { Metadata } from "next";
import { Inter, Roboto_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepInfluence - Connect with Verified Experts",
  description: "Connect with verified experts, influencers, and certified trainers across all domains. Professional consultation platform with 24/7 support.",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning={true} className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
