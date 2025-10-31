'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BarChart3, Link2, FileText, TrendingUp } from 'lucide-react'

interface Message {
  id: number
  text: string
  type: 'user' | 'assistant'
  delay: number
}

const demoMessages: Message[] = [
  {
    id: 1,
    text: "Analyze competitors for sustainable fashion",
    type: 'user',
    delay: 1000
  },
  {
    id: 2,
    text: "Found 847 keyword opportunities. Top 3:\n\n1. 'sustainable activewear brands' - 2,400/mo, Medium difficulty\n2. 'organic cotton guide' - 1,800/mo, Low difficulty\n3. 'ethical fashion 2025' - 3,200/mo, Medium difficulty\n\nWould you like me to create content for any of these?",
    type: 'assistant',
    delay: 2500
  },
  {
    id: 3,
    text: "Create an article about sustainable activewear",
    type: 'user',
    delay: 8000
  },
  {
    id: 4,
    text: "# The Ultimate Guide to Sustainable Activewear Brands\n\n## Introduction\nSustainable activewear is revolutionizing the fitness industry. As consumers become more conscious of their environmental impact, brands are responding with eco-friendly alternatives...\n\n## Key Features\n- **Organic Cotton**: Natural, breathable, biodegradable\n- **Recycled Polyester**: Made from plastic bottles\n- **Low Impact Dyes**: Water-conserving color processes\n\n## Top Brands\n1. Patagonia - Leader in environmental responsibility\n2. Athleta - Sustainable performance wear\n3. Girlfriend Collective - Size-inclusive eco-activewear\n\n## SEO Optimized\n- Primary keyword: 'sustainable activewear brands'\n- Meta description: 160 characters\n- Content length: 2,500+ words\n- Internal linking: 8 relevant links\n- Image optimization: All images compressed and alt-tagged",
    type: 'assistant',
    delay: 10000
  }
]

export function AnimatedChatbot() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (currentMessageIndex >= demoMessages.length) {
      // Reset after showing all messages
      setTimeout(() => {
        setVisibleMessages([])
        setCurrentMessageIndex(0)
        setTypingText('')
      }, 5000)
      return
    }

    const currentMessage = demoMessages[currentMessageIndex]
    const timer = setTimeout(() => {
      setIsTyping(true)
      setTypingText('')
      
      // Type out the message character by character
      let charIndex = 0
      const typingInterval = setInterval(() => {
        if (charIndex < currentMessage.text.length) {
          setTypingText(currentMessage.text.slice(0, charIndex + 1))
          charIndex++
        } else {
          clearInterval(typingInterval)
          setIsTyping(false)
          
          // Add message to visible messages
          setVisibleMessages(prev => [...prev, currentMessage])
          
          // Move to next message
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1)
          }, 1000)
        }
      }, 30) // Typing speed

      return () => clearInterval(typingInterval)
    }, currentMessage.delay)

    return () => clearTimeout(timer)
  }, [currentMessageIndex])

  return (
    <div className="w-full max-w-4xl mx-auto h-[600px] flex flex-col bg-gradient-to-br from-orange-950/10 via-background to-background rounded-2xl backdrop-blur-sm border border-border/50 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI SEO Assistant</h3>
            <p className="text-xs text-muted-foreground">Typing...</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {visibleMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={message.type === 'user'
                  ? 'bg-primary/20 text-primary-foreground rounded-2xl px-4 py-3 max-w-[80%] backdrop-blur-sm border border-primary/30'
                  : 'bg-muted/50 text-foreground rounded-2xl px-4 py-3 max-w-[85%] backdrop-blur-sm border border-border/50'
                }
              >
                {message.type === 'assistant' && message.text.includes('#') ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">{message.text}</pre>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted/50 text-foreground rounded-2xl px-4 py-3 backdrop-blur-sm border border-border/50">
              <p className="text-sm whitespace-pre-wrap">{typingText}</p>
              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse">|</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Keywords</p>
            <p className="text-sm font-semibold text-foreground">847</p>
          </div>
          <div className="text-center">
            <Link2 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Backlinks</p>
            <p className="text-sm font-semibold text-foreground">1.2K</p>
          </div>
          <div className="text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Articles</p>
            <p className="text-sm font-semibold text-foreground">156</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Rankings</p>
            <p className="text-sm font-semibold text-foreground">+23%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

