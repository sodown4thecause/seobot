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

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
