import React, { ReactNode } from "react";
import { motion } from "motion/react";

interface ScrollRevealProps {
  key?: React.Key;
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ScrollReveal({ children, delay = 0, className = "", style = {} }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      style={style}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1], // Custom premium easing curve
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
