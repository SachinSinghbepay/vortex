"use client"

import { motion, Variants } from "framer-motion"

export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
}

export const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
}

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        willChange: "opacity",
        position: "relative",
        zIndex: 0,
      }}
    >
      {children}
    </motion.div>
  )
}
