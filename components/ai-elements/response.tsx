"use client";

import { cn } from "@/lib/utils";
import { type ComponentType, memo, useEffect, useState } from "react";
import type { StreamdownProps } from "streamdown";

type StreamdownComponent = ComponentType<StreamdownProps>;

type ResponseProps = Omit<StreamdownProps, 'children'> & {
  children?: string;
  /** Show blinking cursor at end of response during streaming */
  isStreaming?: boolean;
};

export const Response = memo(
  ({ className, children, isStreaming = false, ...props }: ResponseProps) => (
    <ResponseInner className={className} isStreaming={isStreaming} {...props}>
      {children}
    </ResponseInner>
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isStreaming === nextProps.isStreaming
);

Response.displayName = "Response";

function ResponseInner({ className, children, isStreaming = false, ...props }: ResponseProps) {
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

  const proseClassName = cn(
    "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "prose prose-invert prose-base max-w-none",
    "prose-headings:font-semibold prose-headings:text-zinc-100",
    "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
    "prose-p:text-zinc-200 prose-p:leading-7",
    "prose-li:text-zinc-200 prose-li:leading-7",
    "prose-code:text-emerald-400 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
    "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700/50",
    "prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-indigo-300",
    "prose-strong:text-zinc-100 prose-strong:font-semibold",
    "prose-em:text-zinc-300",
    className
  );

  return (
    <div className={cn("response-container", isStreaming && "is-streaming")}>
      {Streamdown ? (
        <Streamdown className={proseClassName} {...props}>
          {children ?? ""}
        </Streamdown>
      ) : (
        <div className={proseClassName}>{children ?? ""}</div>
      )}
      <style jsx global>{`
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
      `}</style>
    </div>
  );
}
