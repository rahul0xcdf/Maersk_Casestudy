import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Olist Analytics Dashboard",
  description: "GenAI-powered chat assistant and dashboard for Brazilian E-Commerce Public Dataset by Olist. Built By Rahul R",
  keywords: ["Olist", "E-Commerce", "Dashboard", "Analytics", "AI", "Chat", "Brazil", "Next.js", "TypeScript", "Gemini"],
  authors: [{ name: "Rahul R" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Olist E-Commerce Analytics Dashboard",
    description: "GenAI-powered analytics dashboard for Brazilian E-Commerce data",
    url: "https://apmollar-casestudy.vercel.app/",
    siteName: "Olist Analytics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Olist E-Commerce Analytics Dashboard",
    description: "GenAI-powered analytics dashboard for Brazilian E-Commerce data",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
