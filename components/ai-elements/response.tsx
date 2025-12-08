"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled to prevent "Illegal constructor" error
// Streamdown uses browser-only APIs that aren't available during SSR
const Streamdown = dynamic(
  () => import("streamdown").then((mod) => mod.Streamdown),
  { ssr: false }
);

type StreamdownProps = ComponentProps<typeof Streamdown>;

type ResponseProps = Omit<StreamdownProps, 'children'> & {
  children?: string;
  /** Show blinking cursor at end of response during streaming */
  isStreaming?: boolean;
};

export const Response = memo(
  ({ className, children, isStreaming = false, ...props }: ResponseProps) => (
    <div
      className={cn(
        "response-container",
        isStreaming && "is-streaming"
      )}
    >
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          // Better typography for streaming markdown
          "prose prose-invert prose-base max-w-none",
          // Improved heading styles
          "prose-headings:font-semibold prose-headings:text-zinc-100",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          // Better paragraph and list spacing
          "prose-p:text-zinc-200 prose-p:leading-7",
          "prose-li:text-zinc-200 prose-li:leading-7",
          // Code styling
          "prose-code:text-emerald-400 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/50",
          // Link styling
          "prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-indigo-300",
          // Strong and emphasis
          "prose-strong:text-zinc-100 prose-strong:font-semibold",
          "prose-em:text-zinc-300",
          className
        )}
        {...props}
      >
        {children ?? ''}
      </Streamdown>
      <style jsx global>{`
        /* Blinking cursor that appears at the end of streaming content */
        .response-container.is-streaming .prose > *:last-child::after {
          content: '';
          display: inline-block;
          width: 3px;
          height: 1.1em;
          background-color: rgb(129, 140, 248); /* indigo-400 */
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
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isStreaming === nextProps.isStreaming
);

Response.displayName = "Response";
