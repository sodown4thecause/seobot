import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AIStateProvider } from '@/lib/context/ai-state-context';
import { PostHogProvider } from '@/components/providers/analytics-provider';
import { PostHogPageView } from '@/components/providers/posthog-page-view';
import { SITE_URL } from '@/lib/seo/site';
import { siteSchemaMarkup } from '@/lib/seo/site-schema';

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Intent-Based Marketing & AI SEO Platform | FlowIntent",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  description: "FlowIntent unifies SEO, GEO and AEO research for Google, ChatGPT, Perplexity and Google AI Overviews, with live data and content workflows.",
  keywords: [
    "intent based marketing",
    "answer engine optimization",
    "AI SEO platform",
    "buyer intent data",
    "intent marketing",
    "AEO",
    "ChatGPT SEO",
    "Perplexity SEO",
    "AI content optimizer",
    "AI search optimization",
    "EEAT optimization",
    "LLM citations",
  ],
  authors: [{ name: "FlowIntent" }],
  openGraph: {
    title: "Intent-Based Marketing & AI SEO Platform | FlowIntent",
    description: "AI-powered intent marketing platform for answer engine optimization. Optimize for Google, ChatGPT, Perplexity & Gemini. AI Trust Audits, buyer intent data, and automated content creation.",
    url: "https://flowintent.com",
    siteName: "FlowIntent",
    type: "website",
    locale: "en_US",
    images: [{ url: "https://flowintent.com/logo-new.png", width: 1200, height: 630, alt: "FlowIntent - Intent-Based Marketing & AI SEO Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intent-Based Marketing & AI SEO Platform | FlowIntent",
    description: "AI-powered intent marketing platform for answer engine optimization. Optimize for Google, ChatGPT, Perplexity & Gemini.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-P2ZQN2NR');`,
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-GRL7VE85GX" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GRL7VE85GX');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchemaMarkup) }}
        />
      </head>
      <body
        className={`${notoSans.variable} font-sans antialiased`}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P2ZQN2NR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <PostHogProvider>
          <Suspense>
            <PostHogPageView />
          </Suspense>
          <AIStateProvider>
            {children}
          </AIStateProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
