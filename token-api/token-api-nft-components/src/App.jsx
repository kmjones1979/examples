import React from "react";
import ActivityFeed from "./components/ActivityFeed.jsx";
import CollectionStatsBadge from "./components/CollectionStatsBadge.jsx";
import NFTTopHolders from "./components/NFTTopHolders.jsx";
import NFTWalletHoldings from "./components/NFTWalletHoldings.jsx";
import RecentMintsTable from "./components/RecentMintsTable.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>Token-API NFT Components Demo</h1>

      <section style={{ marginBottom: 40 }}>
        <ActivityFeed />
      </section>

      <hr />

      <section style={{ margin: "40px 0" }}>
        <CollectionStatsBadge />
      </section>

      <hr />

      <section style={{ margin: "40px 0" }}>
        <NFTTopHolders />
      </section>

      <hr />

      <section style={{ margin: "40px 0" }}>
        <NFTWalletHoldings />
      </section>

      <hr />

      <section style={{ margin: "40px 0" }}>
        <RecentMintsTable />
      </section>
    </div>
  );
} 