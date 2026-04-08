import { cn } from "@/lib/utils";

export function SectionShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <p className="text-xs uppercase tracking-[0.35em] text-sage">{eyebrow}</p>
      <h2 className="mt-3 font-heading text-4xl leading-tight text-sage sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-ink/70 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

