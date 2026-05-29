import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-sage/15 bg-white/85 shadow-soft backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
