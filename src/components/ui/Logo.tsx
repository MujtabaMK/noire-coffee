import { cn } from "@/lib/cn";

/** NOIRÉ wordmark — set in Playfair with a bronze accent on the É. */
export default function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-xl md:text-[1.4rem]", lg: "text-4xl md:text-5xl" };
  return (
    <span className={cn("display inline-flex items-baseline tracking-[0.3em] text-cream", sizes[size], className)}>
      NOIR<span className="text-bronze">É</span>
    </span>
  );
}
