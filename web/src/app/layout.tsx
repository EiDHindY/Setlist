import type { Metadata, Viewport } from "next";
import { Outfit, Montserrat } from "next/font/google";
import { PlaybackProvider } from "@/contexts/PlaybackContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SETLIST",
  description: "Premium Music Collection Manager",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#002b36",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <PlaybackProvider>
          {children}
        </PlaybackProvider>
      </body>
    </html>
  );
}
