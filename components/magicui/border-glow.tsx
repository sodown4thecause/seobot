"use client";

import { type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface BorderGlowProps extends ComponentPropsWithoutRef<"div"> {
  glowColor?: string;
  glowSize?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BorderGlow({
  glowColor = "rgba(168, 85, 247, 0.6)",
  glowSize = "20px",
  className,
  children,
  ...props
}: BorderGlowProps) {
  return (
    <div
      className={cn("group relative overflow-hidden rounded-[inherit]", className)}
      style={
        {
          "--glow-color": glowColor,
          "--glow-size": glowSize,
        } as CSSProperties
      }
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `0 0 var(--glow-size) var(--glow-color)`,
        }}
      />
      {children}
    </div>
  );
}