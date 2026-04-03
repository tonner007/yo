import WalletConnectButton from "./WalletConnectButton";

export default function TopBar() {
  return (
    <div className="px-6 py-4 w-full">
      <div className="header-actions flex items-center justify-center gap-4">
        <div className="border border-border rounded-full px-5 py-2 text-sm font-semibold text-foreground">
          TOTAL TVL: <span className="text-white">$69.03M</span>
        </div>
        
        <WalletConnectButton />
      </div>
    </div>
  );
}