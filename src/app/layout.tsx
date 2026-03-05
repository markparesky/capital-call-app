import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Capital Call Manager",
  description: "Generate capital call emails with wire instructions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <SessionProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
