import { Info } from "lucide-react";

export default function HoldingsCard({ label, value, subtitle, showInfo, highlight, onSubtitleClick }) {
  return (
    <div className="stat-card top-card position-card-content">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{label}</span>
        {showInfo && <Info className="w-3 h-3 text-muted-foreground" />}
      </div>
      <div className="flex flex-col flex-grow">
        <div className="flex flex-col justify-between flex-grow">
          <div className="text-2xl font-bold text-foreground mb-2">
            {value}
            {highlight && <span className="ml-2 text-xl">✨</span>}
          </div>
          {subtitle && (
            <div 
              onClick={onSubtitleClick}
              className={`text-xs text-primary mt-auto font-medium ${onSubtitleClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}