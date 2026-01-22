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
            variables: {
              colorPrimary: '#ffffff',
              colorBackground: '#000000',
              colorInputBackground: '#18181b',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: '#71717a',
              borderRadius: '0',
            },
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent shadow-none border-0',
              headerTitle: 'text-white font-black uppercase tracking-tight',
              headerSubtitle: 'text-zinc-500 font-mono text-xs uppercase tracking-widest',
              socialButtonsBlockButton: 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white font-semibold uppercase tracking-wide text-sm transition-all',
              socialButtonsBlockButtonText: 'text-white font-semibold',
              socialButtonsProviderIcon: 'brightness-0 invert',
              dividerLine: 'bg-zinc-800',
              dividerText: 'text-zinc-600 uppercase text-xs tracking-widest',
              formFieldLabel: 'text-zinc-400 uppercase text-xs tracking-wider font-medium',
              formFieldInput: 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white focus:ring-1 focus:ring-white rounded-none',
              formButtonPrimary: 'bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider rounded-none text-sm h-12',
              footerActionLink: 'text-white hover:text-zinc-300 underline uppercase text-xs tracking-wider',
              footerActionText: 'text-zinc-500 uppercase text-xs tracking-wider',
              formFieldAction: 'text-zinc-400 hover:text-white text-xs uppercase tracking-wider',
              userButtonPopoverCard: 'bg-zinc-900 border-zinc-800',
              userButtonPopoverActionButton: 'text-white hover:bg-zinc-800',
              userButtonPopoverActionButtonText: 'text-white',
              userButtonPopoverFooter: 'hidden',
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

