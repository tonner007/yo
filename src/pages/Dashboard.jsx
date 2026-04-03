import TopBar from "../components/defi/TopBar";
import VaultHeader from "../components/defi/VaultHeader";
import HoldingsGrid from "../components/defi/HoldingsGrid";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="max-w-7xl mx-auto">
        <VaultHeader />
        <HoldingsGrid />
      </div>
    </div>
  );
}