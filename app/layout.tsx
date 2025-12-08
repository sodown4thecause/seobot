import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SEO Platform - AI-Powered SEO Assistant",
  description: "Your AI SEO assistant that analyzes competitors, finds opportunities, and creates content that ranks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${notoSans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
