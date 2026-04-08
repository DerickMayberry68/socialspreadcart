import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  variant?: "rect" | "circle";
  className?: string;
  priority?: boolean;
};

export function Logo({
  href = "/",
  variant = "rect",
  className,
  priority = false,
}: LogoProps) {
  const image = (
    <Image
      alt="The Social Spread Cart logo"
      src={
        variant === "rect"
          ? "/brand/logos/logo-rect.png"
          : "/brand/logos/logo-circle.png"
      }
      width={variant === "rect" ? 320 : 220}
      height={variant === "rect" ? 268 : 220}
      priority={priority}
      className={cn("h-auto w-full", className)}
    />
  );

  return href ? <Link href={href}>{image}</Link> : image;
}

