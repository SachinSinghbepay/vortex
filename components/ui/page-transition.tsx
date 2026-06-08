"use client"

import { motion, Variants } from "framer-motion"

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
}

// translateZ(0) promotes to own GPU layer; willChange omitted — it over-composites children on Android Chrome
const gpuStyle = { transform: "translateZ(0)" }

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
      style={gpuStyle}
    >
      {children}
    </motion.div>
  )
}
