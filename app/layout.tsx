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
  title: "AI SEO Platform - Rank in Google & AI Search Engines | FlowIntent",
  description: "FlowIntent is the AI-powered SEO platform that optimizes for Google, ChatGPT, and Perplexity. Get AI Trust Audits, competitor analysis, and automated content creation. Free trial.",
  keywords: ["AI SEO platform", "AI SEO tool", "answer engine optimization", "AEO", "ChatGPT SEO", "Perplexity SEO", "SEO content generator", "AI content optimizer"],
  authors: [{ name: "FlowIntent" }],
  openGraph: {
    title: "AI SEO Platform - Rank in Google & AI Search Engines | FlowIntent",
    description: "FlowIntent is the AI-powered SEO platform that optimizes for Google, ChatGPT, and Perplexity. Get AI Trust Audits, competitor analysis, and automated content creation.",
    url: "https://flowintent.com",
    siteName: "FlowIntent",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI SEO Platform - Rank in Google & AI Search Engines | FlowIntent",
    description: "FlowIntent is the AI-powered SEO platform that optimizes for Google, ChatGPT, and Perplexity. Get AI Trust Audits, competitor analysis, and automated content creation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "FlowIntent",
        "applicationCategory": "SEOApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "priceValidUntil": "2026-12-31",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "2000",
        },
        "description": "AI-powered SEO platform that optimizes for Google, ChatGPT, and Perplexity. Get AI Trust Audits, competitor analysis, and automated content creation.",
        "url": "https://flowintent.com",
      },
      {
        "@type": "Organization",
        "name": "FlowIntent",
        "url": "https://flowintent.com",
        "logo": "https://flowintent.com/logo.png",
        "description": "AI-powered SEO platform for Google and AI search engines",
        "sameAs": [
          "https://twitter.com/flowintent",
          "https://linkedin.com/company/flowintent",
        ],
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
        />
      </head>
      <body
        className={`${notoSans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
