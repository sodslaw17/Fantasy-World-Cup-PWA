import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { BottomNav } from "@/components/nav/BottomNav";

export const metadata: Metadata = {
  title: "WC26 Pool",
  description: "Fantasy World Cup 2026 prediction pool",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WC26 Pool",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#C8A24B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-ink text-paper antialiased">
        <ServiceWorkerRegistrar />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
