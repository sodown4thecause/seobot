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
    JSON.stringify(prevProps.reasoningSteps) === JSON.stringify(nextProps.reasoningSteps) &&
    JSON.stringify(prevProps.citations) === JSON.stringify(nextProps.citations)
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

  // Article-style prose classes - COMPACT SPACING
  const proseClassName = cn(
    "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "prose prose-invert max-w-none",
    
    // Headings - Tighter spacing
    "prose-headings:font-semibold prose-headings:text-zinc-100 prose-headings:tracking-tight",
    "prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-3 prose-h1:mt-5",
    "prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-2 prose-h2:mt-5",
    "prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4",
    "prose-h4:text-base prose-h4:font-medium prose-h4:mb-2 prose-h4:mt-3",
    
    // Paragraphs - Tighter spacing
    "prose-p:text-sm prose-p:text-zinc-300 prose-p:leading-6 prose-p:mb-2",
    
    // Lists - Compact formatting
    "prose-ul:my-2 prose-ul:space-y-1",
    "prose-ol:my-2 prose-ol:space-y-1",
    "prose-li:text-sm prose-li:leading-6",
    "prose-li:marker:text-zinc-500",
    
    // Code - Compact
    "prose-code:text-emerald-400 prose-code:bg-zinc-800/50 prose-code:px-1 prose-code:py-0 prose-code:rounded prose-code:text-xs prose-code:font-medium",
    "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-lg prose-pre:p-2",
    "prose-pre:my-2",
    
    // Links
    "prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-blue-300 prose-a:transition-colors",
    
    // Strong and emphasis
    "prose-strong:text-zinc-100 prose-strong:font-semibold",
    "prose-em:text-zinc-200 prose-em:italic",
    
    // Blockquotes - Compact
    "prose-blockquote:border-l-2 prose-blockquote:border-zinc-700 prose-blockquote:pl-3 prose-blockquote:my-2 prose-blockquote:text-zinc-400 prose-blockquote:text-sm",
    
    // Horizontal rule - Tight
    "prose-hr:border-zinc-800 prose-hr:my-4",
    
    // Tables - Compact
    "prose-table:my-2 prose-thead:border-zinc-800 prose-th:text-zinc-200 prose-th:font-semibold prose-th:text-sm",
    "prose-td:text-zinc-300 prose-td:text-sm prose-tr:border-zinc-800",
    
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

  const renderedContent = renderContent();
  const shouldUseStreamdown = Streamdown && !(citations && citations.length > 0);

  return (
    <div className="article-response">
      {/* Sources at the top - Tighter margin */}
      {sources && sources.length > 0 && (
        <Sources sources={sources} className="mb-2" />
      )}
      
      {/* Reasoning section - Tighter margin */}
      {reasoningSteps && reasoningSteps.length > 0 && (
        <Reasoning steps={reasoningSteps} isActive={isReasoning} className="mb-1" />
      )}
      
      {/* Main content - NO copy/download icons */}
      <div className={cn("response-container", isStreaming && "is-streaming")}>
        {shouldUseStreamdown ? (
          <Streamdown className={proseClassName} {...props}>
            {children ?? ""}
          </Streamdown>
        ) : (
          <div className={proseClassName}>{renderedContent ?? ""}</div>
        )}
      </div>
      
      <style jsx global>{`
        .article-response {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .response-container.is-streaming .prose > *:last-child::after {
          content: '';
          display: inline-block;
          width: 2px;
          height: 1em;
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
      `}</style>
    </div>
  );
}
