"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function FloatingCta() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6"
    >
      <Link
        href="/contact"
        className="inline-flex items-center rounded-full bg-sage px-5 py-3 text-sm font-medium uppercase tracking-[0.18em] text-cream shadow-frame transition hover:-translate-y-0.5 hover:bg-sage-700"
      >
        Book the Cart
      </Link>
    </motion.div>
  );
}
