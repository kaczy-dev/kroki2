import { motion } from "framer-motion";

export function LoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto max-w-md px-4 py-16 space-y-6">
        {/* Ring skeleton */}
        <div className="flex justify-center">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-[280px] h-[280px] rounded-full bg-surface border-2 border-ink/10"
          />
        </div>

        {/* Metrics skeleton */}
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              className="h-20 rounded bg-surface border border-ink/10"
            />
          ))}
        </div>

        {/* Button skeleton */}
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-14 rounded bg-surface border border-ink/10"
        />
      </div>
    </div>
  );
}
