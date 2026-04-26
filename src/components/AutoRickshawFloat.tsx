"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function AutoRickshawFloat() {
  return (
    <motion.div
      aria-hidden="true"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
      className="relative h-14 w-16 overflow-hidden rounded-2xl bg-black/5"
    >
      <Image
        src="/images/autorickshaw_green.png?v=2"
        alt=""
        fill
        className="object-contain scale-[1.1] origin-center"
        style={{ inset: 0 }}
        sizes="64px"
      />
    </motion.div>
  );
}

