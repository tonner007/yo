import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const USDC_ADDRESSES = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
};

const NETWORKS = [
  { id: "base", label: "Base" },
  { id: "ethereum", label: "Ethereum" },
  { id: "arbitrum", label: "Arbitrum One" },
];

export default function NetworkSelector({ onNetworkChange }) {
  const [selectedNetwork, setSelectedNetwork] = useState("base");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (networkId) => {
    setSelectedNetwork(networkId);
    setOpen(false);
    if (onNetworkChange) {
      onNetworkChange({ network: networkId, address: USDC_ADDRESSES[networkId] });
    }
  };

  const current = NETWORKS.find((n) => n.id === selectedNetwork);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
        className="stat-card top-card cursor-pointer hover:border-muted-foreground transition-colors select-none"
      >
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">USDC</span>
        </div>
        <div className="flex flex-col flex-grow justify-between">
          <div className="mt-auto">
            <div className="text-2xl font-bold text-foreground">{current.label}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-3">
                <div className="asset-icon w-6 h-6">
                  <img
                    src="/icons/usdc.png"
                    alt="USDC"
                    className="w-full h-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Select network</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[200px] overflow-hidden">
          {NETWORKS.map((network) => (
            <div
              key={network.id}
              onClick={() => handleSelect(network.id)}
              className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-secondary transition-colors"
            >
              <div className="asset-icon w-8 h-8">
                <img
                  src="/icons/usdc.png"
                  alt="USDC"
                />
              </div>
              <div className="flex-1">
                <div className="text-foreground font-bold text-sm">USDC</div>
                <div className="text-muted-foreground text-xs">{network.label}</div>
              </div>
              {selectedNetwork === network.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}