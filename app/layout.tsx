import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AIStateProvider } from '@/lib/context/ai-state-context';

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
    <>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <ClerkProvider
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#6366f1', // indigo-500
              colorBackground: '#09090b', // zinc-950
              colorInputBackground: '#18181b', // zinc-900
              colorInputText: '#fafafa', // zinc-50
              colorText: '#fafafa', // zinc-50
              colorTextSecondary: '#a1a1aa', // zinc-400
              borderRadius: '0.75rem',
            },
            elements: {
              formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm font-medium',
              card: 'bg-zinc-900/50 backdrop-blur-xl border-zinc-800',
              headerTitle: 'text-zinc-100',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton: 'border-zinc-700 hover:bg-zinc-800',
              formFieldLabel: 'text-zinc-300',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
            },
          }}
        >
          <html lang="en" className="dark" suppressHydrationWarning>
            <head>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
              />
            </head>
            <body
              className={`${notoSans.variable} font-sans antialiased`}
            >
              <AIStateProvider>
                {children}
              </AIStateProvider>
            </body>
          </html>
        </ClerkProvider>
      ) : (
        <html lang="en" className="dark" suppressHydrationWarning>
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
      )}
    </>
  );
}

