import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { cva, type VariantProps } from "class-variance-authority";
import { User, Bot } from "lucide-react";
import type { HTMLAttributes } from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

// Clean message layout - icons on left, content aligned
export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full gap-4 py-3",
      from === "user" ? "is-user" : "is-assistant",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "flex flex-col gap-2 text-[15px] leading-relaxed font-normal flex-1",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[85%] px-4 py-3 rounded-2xl",
          "group-[.is-user]:bg-zinc-700/60 group-[.is-user]:text-zinc-100",
          "group-[.is-assistant]:bg-zinc-800/40 group-[.is-assistant]:text-zinc-100",
        ],
        flat: [
          // Clean text without boxes
          "group-[.is-user]:text-zinc-200",
          "group-[.is-assistant]:text-zinc-300",
        ],
      },
    },
    defaultVariants: {
      variant: "flat",
    },
  }
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>;

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(messageContentVariants({ variant, className }))}
    {...props}
  >
    {children}
  </div>
);

export type MessageAvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string;
  name?: string;
  isUser?: boolean;
};

// Simple outline icon avatars matching the GenUI demo style
export const MessageAvatar = ({
  name,
  className,
  isUser,
  ...props
}: MessageAvatarProps) => (
  <div
    className={cn(
      "flex-shrink-0 w-6 h-6 flex items-center justify-center text-zinc-400",
      className
    )}
    {...props}
  >
    {isUser || name === "You" || name === "User" ? (
      <User className="w-5 h-5" strokeWidth={1.5} />
    ) : (
      <Bot className="w-5 h-5" strokeWidth={1.5} />
    )}
  </div>
);
