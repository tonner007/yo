import { Wallet } from "lucide-react";

export default function TopBar() {
  return (
    <div className="px-6 py-4 w-full">
      <div className="header-actions flex items-center justify-center gap-4">
        <div className="border border-border rounded-full px-5 py-2 text-sm font-semibold text-foreground">
          TOTAL TVL: <span className="text-white">$69.03M</span>
        </div>
        <button className="bg-primary text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Wallet className="w-4 h-4" />
          CONNECT WALLET
        </button>
      </div>
    </div>
  );
}