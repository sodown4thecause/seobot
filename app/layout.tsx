import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AIStateProvider } from '@/lib/context/ai-state-context';
import { SITE_URL } from '@/lib/seo/site';

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
  description: "FlowIntent is the AI-powered intent marketing platform for answer engine optimization (AEO). Optimize for Google, ChatGPT, Perplexity & Gemini. AI Trust Audits, buyer intent data analysis, and automated content creation. Free trial.",
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
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://flowintent.com/#website",
        "name": "FlowIntent",
        "url": "https://flowintent.com",
        "description": "AI-powered intent marketing platform for answer engine optimization (AEO)",
        "publisher": { "@id": "https://flowintent.com/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://flowintent.com/blog?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://flowintent.com/#software",
        "name": "FlowIntent",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "SEO & Answer Engine Optimization",
        "operatingSystem": "Web",
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "0",
          "highPrice": "39",
          "priceCurrency": "USD",
          "offerCount": "2",
        },
        "featureList": [
          "AI Trust Audits",
          "Answer Engine Optimization (AEO)",
          "Competitor Analysis",
          "Buyer Intent Data Analysis",
          "Automated Content Creation",
          "EEAT Scoring",
          "LLM Citation Tracking",
          "DataForSEO Integration (70+ endpoints)",
          "AI Search Visibility Monitoring",
        ],
        "description": "AI-powered intent marketing platform that optimizes for Google, ChatGPT, Perplexity & Gemini. Get AI Trust Audits, buyer intent data analysis, and automated content creation.",
        "url": "https://flowintent.com",
      },
      {
        "@type": "Organization",
        "@id": "https://flowintent.com/#organization",
        "name": "FlowIntent",
        "url": "https://flowintent.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://flowintent.com/logo-new.png",
          "width": 512,
          "height": 512,
        },
        "description": "AI-powered intent marketing platform for Google and AI search engines",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "liam@flowintent.com",
        },
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
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
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
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
            {children}
          </body>
        </html>
      )}
    </>
  );
}
