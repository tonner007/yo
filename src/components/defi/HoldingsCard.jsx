import { Info, Loader2 } from "lucide-react";
import { useState } from "react";

export default function HoldingsCard({ 
  label, 
  value, 
  subtitle, 
  showInfo, 
  highlight, 
  onSubtitleClick,
  isLoading = false,
  tooltip,
  valueClassName = "text-foreground"
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="stat-card top-card position-card-content relative">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{label}</span>
        {showInfo && (
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
            {tooltip && showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-[50%] min-w-[160px]">
                <div className="stat-card top-card position-card-content px-3 py-2 text-sm text-muted-foreground shadow-xl whitespace-normal break-words leading-relaxed">
                  {tooltip}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-2.5 h-2.5 bg-card border-r border-b border-border rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow">
        <div className="flex flex-col justify-between flex-grow">
          <div className={`text-2xl font-bold mb-2 flex items-center ${valueClassName}`}>
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              value
            )}
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