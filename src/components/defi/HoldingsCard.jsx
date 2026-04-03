import { Info } from "lucide-react";

export default function HoldingsCard({ label, value, subtitle, showInfo, highlight }) {
  return (
    <div className="stat-card top-card">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{label}</span>
        {showInfo && <Info className="w-3 h-3 text-muted-foreground" />}
      </div>
      <div className="flex flex-col flex-grow justify-between">
        <div className="mt-auto">
          <div className="text-2xl font-bold text-foreground">
            {value}
            {highlight && <span className="ml-1.5 text-sm">✨</span>}
          </div>
          {subtitle && (
            <div className="text-xs text-primary mt-1 font-medium">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}