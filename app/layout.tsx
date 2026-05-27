import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionInitializer } from "./components/session-initializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FHIR Adapter Admin",
  description: "Operational admin console for the FHIR adapter pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <SessionInitializer />
        {children}
      </body>
    </html>
  );
}
