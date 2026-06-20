import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  active: boolean;
  paused: boolean;
}

export function ActiveSession({ active, paused }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => {
      if (!paused) {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [active, paused, startTime]);

  if (!active) return null;

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="brut-card p-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={!paused ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-2 h-2 rounded-full bg-success"
        />
        <span className="font-display text-[11px] tracking-wide">SESJA AKTYWNA</span>
      </div>
      <div className="font-mono text-sm tabular-nums text-ink/70">
        {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
      </div>
    </motion.div>
  );
}
