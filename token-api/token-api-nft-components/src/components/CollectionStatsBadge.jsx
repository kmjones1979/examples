import React, { useState } from "react";

// API Documentation: https://token-api.service.pinax.network/#tag/evm/GET/nft/collections/evm/%7Bcontract%7D
// Provides single NFT collection metadata, total supply, owners & total transfers

const JWT = import.meta.env.VITE_TOKEN_API_JWT_KEY;
const API_BASE = "https://token-api.thegraph.com/";

async function tokenFetch(path, params = {}) {
  const url = new URL(path.startsWith("/") ? path.slice(1) : path, API_BASE);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const headers = { Accept: "application/json" };
  if (JWT) headers.Authorization = `Bearer ${JWT}`;
  
  console.log('Making request to:', url.toString());
  console.log('With headers:', headers);
  
  const res = await fetch(url.toString(), { headers });
  console.log('API Response:', {
    status: res.status,
    url: url.toString(),
    params: params
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API Error:', errorText);
    throw new Error(`Token API ${res.status}: ${errorText}`);
  }
  return res.json();
}

export default function CollectionStatsBadge() {
  const [contract, setContract] = useState("0xbd3531da5cf5857e7cfaa92426877b022e612cf8");
  const [network, setNetwork] = useState("mainnet");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCollection = () => {
    if (!contract) return;
    const normalizedContract = contract.toLowerCase();
    setLoading(true);
    setError(null);
    console.log('Fetching collection:', normalizedContract);
    
    tokenFetch(`nft/collections/evm/${normalizedContract}`, {
      network_id: network
    })
      .then((json) => {
        console.log('Collection response:', json);
        setData(Array.isArray(json.data) ? json.data[0] : null);
      })
      .catch(err => {
        console.error('Collection error:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, maxWidth: 400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>NFT Collection Stats</h3>
        <a 
          href="https://token-api.service.pinax.network/#tag/evm/GET/nft/collections/evm/%7Bcontract%7D"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 14, color: "#0366d6", textDecoration: "none" }}
        >
          API Docs ↗
        </a>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          style={{ flex: 1, padding: 4 }}
          placeholder="Contract address"
          value={contract}
          onChange={(e) => setContract(e.target.value.trim())}
        />
        <select value={network} onChange={(e) => setNetwork(e.target.value)}>
          <option value="mainnet">Ethereum Mainnet</option>
          <option value="arbitrum-one" disabled>Arbitrum One (Coming Soon)</option>
          <option value="base" disabled>Base (Coming Soon)</option>
          <option value="bsc" disabled>BSC (Coming Soon)</option>
          <option value="matic" disabled>Polygon (Coming Soon)</option>
          <option value="optimism" disabled>Optimism (Coming Soon)</option>
        </select>
        <button onClick={fetchCollection}>Fetch</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {!loading && !error && !data && contract && <p>No collection found.</p>}

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <strong>{data.name} ({data.symbol})</strong>
          <span>Token Standard: {data.token_standard}</span>
          <span>Total Supply: {data.total_supply?.toLocaleString()}</span>
          <span>Unique Supply: {data.total_unique_supply?.toLocaleString()}</span>
          <span>Owners: {data.owners?.toLocaleString()}</span>
          <span>Total Transfers: {data.total_transfers?.toLocaleString()}</span>
          <span>Network: {data.network_id}</span>
        </div>
      )}
    </div>
  );
} 