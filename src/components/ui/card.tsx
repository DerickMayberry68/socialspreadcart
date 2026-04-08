import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-sage/15 bg-white/85 shadow-soft backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

