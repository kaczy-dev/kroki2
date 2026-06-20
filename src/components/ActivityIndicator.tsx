import { motion } from "framer-motion";
import { memo } from "react";
import { getActivityType, getActivityLabel, getActivityEmoji, getIntensityZone } from "@/lib/smart-goals";

interface Props {
  cadence: number;
}

/** #2 Activity type detection + #3 Intensity zones — compact display */
export const ActivityIndicator = memo(function ActivityIndicator({ cadence }: Props) {
  if (cadence === 0) return null;

  const type = getActivityType(cadence);
  const zone = getIntensityZone(cadence);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/8 bg-surface/50"
    >
      <span className="text-base">{getActivityEmoji(type)}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-display">{getActivityLabel(type)}</div>
        <div className="text-[8px] font-mono text-muted">{cadence} kr/min · Zona {zone.zone}</div>
      </div>
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: zone.color, boxShadow: `0 0 6px ${zone.color}` }}
      />
    </motion.div>
  );
});
