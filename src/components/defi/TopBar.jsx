import { useState, useEffect } from "react";
import WalletConnectButton from "./WalletConnectButton";
import { getTotalTvl } from "../../utils/getTotalTvl";

// Fallback hodnota pro případ chyby
const DEFAULT_TVL = "$40.12M";

export default function TopBar() {
  const [tvl, setTvl] = useState(DEFAULT_TVL);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadTVL = async () => {
      setIsLoading(true);
      try {
        // Načtení skutečného TVL přes YO SDK
        const result = await getTotalTvl();
        setTvl(result.formatted);
      } catch {
        setTvl(DEFAULT_TVL);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTVL();
    
    // Obnovení TVL každých 60 sekund
    const interval = setInterval(loadTVL, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="px-6 py-4 w-full">
      <div className="header-actions flex items-center justify-center gap-4">
        <div className="border border-border rounded-full px-5 py-3 text-sm font-bold text-foreground flex items-center">
          TOTAL TVL: <span className="text-white ml-1">{isLoading ? "Loading..." : tvl}</span>
        </div>
        
        <WalletConnectButton />
      </div>
    </div>
  );
}