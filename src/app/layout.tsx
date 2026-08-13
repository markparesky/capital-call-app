import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kids Spending",
  description: "Log what you buy — takes 5 seconds",
  appleWebApp: {
    capable: true,
    title: "Spending",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <main className="px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
