"use client";

import { cn } from "@/lib/utils";
import { type ComponentType, memo, useEffect, useState } from "react";
import type { StreamdownProps } from "streamdown";

// Import new AI Elements components
import { Sources, SourceItem } from "./sources";
import { Reasoning, ReasoningStep } from "./reasoning";
import { CitationText } from "./inline-citation";

// Extended props for article-style responses
export interface ArticleResponseProps {
  /** Main response text */
  children?: string;
  /** Show blinking cursor at end of response during streaming */
  isStreaming?: boolean;
  /** Sources to display at top of response */
  sources?: SourceItem[];
  /** Reasoning steps to show the AI's thought process */
  reasoningSteps?: ReasoningStep[];
  /** Whether reasoning is still in progress */
  isReasoning?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional citations for inline citation support */
  citations?: Array<{
    number: number;
    title?: string;
    url?: string;
    description?: string;
  }>;
}

type StreamdownComponent = ComponentType<StreamdownProps>;

type ResponseProps = Omit<StreamdownProps, 'children'> & ArticleResponseProps;

export const Response = memo(
  ({ className, children, isStreaming = false, sources, reasoningSteps, isReasoning = false, citations, ...props }: ResponseProps) => (
    <ResponseInner 
      className={className} 
      isStreaming={isStreaming} 
      sources={sources}
      reasoningSteps={reasoningSteps}
      isReasoning={isReasoning}
      citations={citations}
      {...props}
    >
      {children}
    </ResponseInner>
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isReasoning === nextProps.isReasoning &&
    JSON.stringify(prevProps.sources) === JSON.stringify(nextProps.sources) &&
    JSON.stringify(prevProps.reasoningSteps) === JSON.stringify(nextProps.reasoningSteps)
);

Response.displayName = "Response";

function ResponseInner({ 
  className, 
  children, 
  isStreaming = false, 
  sources,
  reasoningSteps,
  isReasoning = false,
  citations,
  ...props 
}: ResponseProps) {
  const [Streamdown, setStreamdown] = useState<StreamdownComponent | null>(null);

  useEffect(() => {
    let isActive = true;

    import("streamdown")
      .then((mod) => {
        if (isActive) {
          const LoadedStreamdown: StreamdownComponent = (streamdownProps) => (
            <mod.Streamdown {...streamdownProps} />
          );
          setStreamdown(() => LoadedStreamdown);
        }
      })
      .catch((error) => {
        console.error("[Response] Failed to load streamdown:", error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Article-style prose classes - mimicking the clean article layout
  const proseClassName = cn(
    "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "prose prose-invert max-w-none",
    
    // Headings - Article style with larger, bolder text
    "prose-headings:font-semibold prose-headings:text-zinc-100 prose-headings:tracking-tight",
    "prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8",
    "prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-4 prose-h2:mt-8",
    "prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-6",
    "prose-h4:text-lg prose-h4:font-medium prose-h4:mb-3 prose-h4:mt-4",
    
    // Paragraphs - Clean, readable body text
    "prose-p:text-base prose-p:text-zinc-300 prose-p:leading-7 prose-p:mb-4",
    
    // Lists - Clean formatting
    "prose-ul:my-4 prose-ul:space-y-2",
    "prose-ol:my-4 prose-ol:space-y-2",
    "prose-li:text-zinc-300 prose-li:leading-7",
    "prose-li:marker:text-zinc-500",
    
    // Code - Subtle inline code
    "prose-code:text-emerald-400 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-medium",
    "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-xl prose-pre:p-4",
    "prose-pre:my-4",
    
    // Links - Subtle but visible
    "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300 prose-a:transition-colors",
    
    // Strong and emphasis
    "prose-strong:text-zinc-100 prose-strong:font-semibold",
    "prose-em:text-zinc-200 prose-em:italic",
    
    // Blockquotes
    "prose-blockquote:border-l-4 prose-blockquote:border-zinc-700 prose-blockquote:pl-4 prose-blockquote:my-4 prose-blockquote:text-zinc-400",
    
    // Horizontal rule
    "prose-hr:border-zinc-800 prose-hr:my-8",
    
    // Tables
    "prose-table:my-4 prose-thead:border-zinc-800 prose-th:text-zinc-200 prose-th:font-semibold",
    "prose-td:text-zinc-300 prose-tr:border-zinc-800",
    
    className
  );

  // Prepare content with citations if provided
  const renderContent = () => {
    if (!children) return null;
    
    if (citations && citations.length > 0) {
      return <CitationText text={children} citations={citations} />;
    }
    
    return children;
  };

  return (
    <div className="article-response">
      {/* Sources at the top - Article style */}
      {sources && sources.length > 0 && (
        <Sources sources={sources} className="mb-4" />
      )}
      
      {/* Reasoning section */}
      {reasoningSteps && reasoningSteps.length > 0 && (
        <Reasoning steps={reasoningSteps} isActive={isReasoning} className="mb-2" />
      )}
      
      {/* Main content */}
      <div className={cn("response-container", isStreaming && "is-streaming")}>
        {Streamdown ? (
          <Streamdown className={proseClassName} {...props}>
            {children ?? ""}
          </Streamdown>
        ) : (
          <div className={proseClassName}>{renderContent() ?? ""}</div>
        )}
      </div>
      
      <style jsx global>{`
        .article-response {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .response-container.is-streaming .prose > *:last-child::after {
          content: '';
          display: inline-block;
          width: 3px;
          height: 1.1em;
          background-color: rgb(129, 140, 248);
          margin-left: 2px;
          vertical-align: text-bottom;
          border-radius: 1px;
          animation: cursor-blink 1s step-end infinite;
        }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* Article-style scroll button */
        .scroll-button {
          position: fixed;
          bottom: 100px;
          right: 50%;
          transform: translateX(50%);
          z-index: 50;
        }
      `}</style>
    </div>
  );
}
