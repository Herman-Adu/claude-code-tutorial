import "@/lib/env"; // Triggers env validation at startup
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout";
import { AuthProvider } from "@/components/providers";
import { auth } from "@/lib/auth/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "A Kanban to-do app with drag and drop functionality",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get session on server to hydrate AuthProvider and avoid extra API calls
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider session={session}>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
