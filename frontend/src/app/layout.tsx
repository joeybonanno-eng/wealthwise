import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SessionProvider from "@/providers/SessionProvider";
import BottomNav from "@/components/BottomNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "WealthWise - AI Financial Advisor",
  description:
    "Your personal AI-powered financial advisor with real-time market data",
  manifest: "/manifest.json",
  themeColor: "#059669",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WealthWise",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          {children}
          <BottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
