'use client'

import Link from 'next/link'
import { ArrowRight, Target, MessageSquare, FileCheck, Sparkles } from 'lucide-react'
import { AnimatedChatbot } from '@/components/landing/animated-chatbot'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SEO Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/signin" 
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/onboarding" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors backdrop-blur-sm"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Your AI SEO Assistant<br />
                <span className="text-primary">That Actually Ranks</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Just talk to us. We'll analyze your competitors, find opportunities, 
                and create content that ranks—all in one conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Link 
                  href="/onboarding" 
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center space-x-2 text-lg backdrop-blur-sm shadow-lg"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="px-8 py-4 border-2 border-border text-foreground rounded-lg font-semibold hover:bg-muted/50 transition-colors text-lg backdrop-blur-sm">
                  Watch Demo
                </button>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">✓ No credit card required</span>
                <span className="flex items-center">✓ 5-minute setup</span>
                <span className="flex items-center">✓ Join 2,000+ businesses</span>
              </div>
            </motion.div>

            {/* Right Side - Animated Chatbot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <AnimatedChatbot />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Talk, Don't Type Forms",
                description: "Our AI assistant guides you through setup like a conversation, not a questionnaire"
              },
              {
                icon: Target,
                title: "Instant Competitor Intelligence",
                description: "We analyze your competitors' strategies while you chat, finding gaps you can exploit"
              },
              {
                icon: FileCheck,
                title: "Publish-Ready Content",
                description: "Generate optimized articles that match your brand voice and connect directly to your CMS"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="text-center p-8 rounded-xl border border-border/50 hover:border-primary/50 transition-all bg-card/30 backdrop-blur-sm hover:bg-card/50"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
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
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full font-bold text-xl mb-4 backdrop-blur-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-12 backdrop-blur-sm border border-primary/30">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Ready to Rank Higher?
          </h2>
          <p className="text-xl mb-8 text-muted-foreground">
            Your AI SEO assistant is waiting to help you outrank competitors
          </p>
          <Link 
            href="/onboarding" 
            className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg backdrop-blur-sm shadow-lg"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-card/30 backdrop-blur-sm border-t border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">SEO Platform</span>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered SEO and content creation for businesses of all sizes
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 SEO Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
