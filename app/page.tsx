'use client'

import Link from 'next/link'
import { ArrowRight, Target, MessageSquare, FileCheck, TrendingUp, Zap, Search } from 'lucide-react'
import { GradientOrb } from '@/components/ui/gradient-orb'
import { FeatureCard } from '@/components/ui/feature-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-purple-deep">
      {/* Header */}
      <header className="fixed top-0 w-full glass-dark z-50 shadow-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-primary flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Flow Intent</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-white/80 hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
              >
                <Button className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-purple hover:scale-105 transition-transform">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Gradient Orb Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-20">
              <GradientOrb size="lg" />
            </div>

            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 text-center max-w-4xl mx-auto"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Your Own AI SEO Assistant
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Just talk to us. We'll analyze your competitors, find opportunities, 
                and create content that ranks—all in one conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-purple-lg hover:scale-105 transition-transform text-lg px-8">
                    Start Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="glass text-white border-white/20 hover:bg-white/10 text-lg px-8">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center text-sm text-white/70">
                <span className="flex items-center">✓ No credit card required</span>
                <span className="flex items-center">✓ 5-minute setup</span>
                <span className="flex items-center">✓ Join 2,000+ businesses</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Dominate SEO
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Powered by AI, designed for results
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Conversational AI",
                description: "Talk naturally with our AI assistant. No forms, no complexity—just tell us what you need."
              },
              {
                icon: Target,
                title: "Competitor Analysis",
                description: "We analyze your competitors' strategies in real-time, finding gaps you can exploit to rank higher."
              },
              {
                icon: FileCheck,
                title: "Content Generation",
                description: "Generate publish-ready articles that match your brand voice and SEO requirements instantly."
              },
              {
                icon: Search,
                title: "Keyword Research",
                description: "Discover high-value keywords with low competition. We find opportunities others miss."
              },
              {
                icon: TrendingUp,
                title: "Rank Tracking",
                description: "Monitor your rankings and get actionable insights to improve your search visibility."
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get results in seconds, not hours. Our AI works at the speed of thought."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + idx * 0.1 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up & Chat',
                description: 'Tell our AI about your business in a natural conversation'
              },
              {
                step: '2',
                title: 'We Analyze Everything',
                description: 'While you answer questions, we crawl competitors and find keywords'
              },
              {
                step: '3',
                title: 'Get Opportunities',
                description: 'Receive personalized content opportunities ranked by impact'
              },
              {
                step: '4',
                title: 'Create & Publish',
                description: 'Generate optimized content and publish directly to your site'
              }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 glass text-white rounded-full font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center glass rounded-2xl p-12 shadow-purple-lg">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Ready to Rank Higher?
          </h2>
          <p className="text-xl mb-8 text-white/80">
            Your AI SEO assistant is waiting to help you outrank competitors
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-purple-lg hover:scale-105 transition-transform text-lg px-8">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 glass-dark border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-primary flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">Flow Intent</span>
              </div>
              <p className="text-white/70 text-sm">
                AI-powered SEO and content creation for businesses of all sizes
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/70">
            <p>&copy; 2025 Flow Intent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
