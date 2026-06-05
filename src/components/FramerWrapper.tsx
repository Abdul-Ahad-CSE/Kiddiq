"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface WrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function FadeIn({ children, className, ...props }: WrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function StaggerContainer({ children, className, ...props }: WrapperProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function StaggerItem({ children, className, ...props }: WrapperProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Float({ children, className, ...props }: WrapperProps) {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 5.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
