import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { BurstShape } from "./doodles";

export const btnVariants = cva(
  "chaos-jitter relative inline-flex select-none items-center justify-center gap-2 border-[3px] border-ink font-display font-extrabold uppercase leading-none tracking-tight transition-[transform,box-shadow,background-color] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      tone: {
        lime: "bg-lime text-ink shadow-hard hover:shadow-hard-lg",
        cobalt: "bg-cobalt text-paper shadow-hard hover:shadow-hard-lg",
        orange: "bg-orange text-ink shadow-hard hover:shadow-hard-lg",
        paper: "bg-paper text-ink shadow-hard hover:shadow-hard-lg",
        ink: "bg-ink text-paper shadow-hard-lime hover:bg-cobalt-deep",
        ghost: "border-transparent bg-transparent text-current shadow-none underline decoration-wavy underline-offset-4 hover:translate-x-0 hover:translate-y-0",
      },
      size: {
        sm: "rounded-full px-3 py-2 text-xs",
        md: "rounded-full px-5 py-3 text-sm",
        lg: "rounded-full px-7 py-4 text-base md:text-lg",
        xl: "rounded-[1.4rem] px-7 py-5 text-xl md:px-10 md:py-6 md:text-3xl",
      },
    },
    defaultVariants: { tone: "lime", size: "md" },
  },
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btnVariants>;

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { className, tone, size, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(btnVariants({ tone, size }), className)} {...props} />;
});

const stickerTone = {
  lime: "bg-lime text-ink",
  orange: "bg-orange text-ink",
  cobalt: "bg-cobalt text-paper",
  paper: "bg-paper text-ink",
  ink: "bg-ink text-lime",
} as const;
export type Tone = keyof typeof stickerTone;

export function Sticker({
  children,
  tone = "lime",
  shape = "pill",
  className,
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  shape?: "pill" | "tag" | "circle";
  className?: string | undefined;
  style?: CSSProperties | undefined;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center justify-center border-[3px] border-ink font-display font-extrabold uppercase leading-none tracking-tight shadow-hard",
        stickerTone[tone],
        shape === "pill" && "rounded-full px-4 py-2",
        shape === "tag" && "rounded-md px-3 py-1.5",
        shape === "circle" && "aspect-square rounded-full p-3 text-center",
        className,
      )}
    >
      {children}
    </span>
  );
}

const burstFill = {
  lime: "fill-lime text-ink",
  orange: "fill-orange text-ink",
  cobalt: "fill-cobalt text-paper",
  paper: "fill-paper text-ink",
  ink: "fill-ink text-lime",
} as const;

export function BurstSticker({
  children,
  tone = "lime",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const [fill = "", text = ""] = burstFill[tone].split(" ");
  return (
    <span className={cn("relative grid aspect-square place-items-center", className)}>
      <BurstShape className={fill} />
      <span
        className={cn(
          "relative z-10 px-[16%] text-center font-display font-extrabold uppercase leading-[0.9] tracking-tight",
          text,
        )}
      >
        {children}
      </span>
    </span>
  );
}

const tapeTone = {
  lime: "bg-lime/75",
  orange: "bg-orange/75",
  cobalt: "bg-cobalt/60",
} as const;

export function Tape({
  tone = "lime",
  className,
}: {
  tone?: keyof typeof tapeTone | "none" | undefined;
  className?: string;
}) {
  if (tone === "none") return null;
  return (
    <span
      aria-hidden
      className={cn(
        "tape pointer-events-none absolute -top-3.5 left-1/2 z-20 h-7 w-24 -translate-x-1/2 -rotate-3 mix-blend-multiply",
        tapeTone[tone],
        className,
      )}
    />
  );
}

/** Small mono label used as section kickers */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs font-bold uppercase tracking-[0.2em] md:text-sm", className)}>{children}</p>
  );
}
