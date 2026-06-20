import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

export function CountUp({ value, className, format }: { value: number; className?: string; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (n) => (format ? format(n) : Math.round(n).toLocaleString("pl-PL")));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
