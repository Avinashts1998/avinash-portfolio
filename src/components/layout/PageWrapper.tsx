import { ReactNode, useState } from "react";
import { motion } from "motion/react";

interface PageWrapperProps {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function PageWrapper({ children, maxWidth = "max-w-[1150px]", className = "" }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex-1 w-full ${maxWidth} mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 py-12 mt-[20px] flex flex-col font-sans ${className}`}
    >
      {children}
    </motion.div>
  );
}
