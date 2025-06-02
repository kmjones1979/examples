import React, { useState } from "react";

// API Documentation: https://token-api.service.pinax.network/#tag/evm/GET/nft/activities/evm
// Provides NFT Activities (ex: transfers, mints & burns)

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

function formatAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function RecentMintsTable() {
  const [contract, setContract] = useState("0xbd3531da5cf5857e7cfaa92426877b022e612cf8");
  const [network, setNetwork] = useState("mainnet");
  const [mints, setMints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMints = () => {
    if (!contract) return;
    const normalizedContract = contract.toLowerCase();
    setLoading(true);
    setError(null);
    console.log('Fetching mints for contract:', normalizedContract);
    
    tokenFetch("nft/activities/evm", { 
      contract: normalizedContract,
      network_id: network,
      "@type": "MINT"
    })
      .then((json) => {
        console.log('Mints response:', json);
        setMints(Array.isArray(json.data) ? json.data : []);
      })
      .catch(err => {
        console.error('Mints error:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Recent Mints</h3>
        <a 
          href="https://token-api.service.pinax.network/#tag/evm/GET/nft/activities/evm"
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
        <button onClick={fetchMints}>Fetch</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {!loading && !error && mints.length === 0 && contract && <p>No mints found.</p>}

      {mints.length > 0 && (
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Time</th>
              <th style={{ textAlign: "left" }}>Token ID</th>
              <th style={{ textAlign: "left" }}>To</th>
              <th style={{ textAlign: "left" }}>Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {mints.map((m, i) => (
              <tr key={`${m.tx_hash}-${i}`}>
                <td>{formatAgo(m.timestamp)}</td>
                <td>#{m.token_id}</td>
                <td>{m.to?.slice(0, 8)}…</td>
                <td>{m.tx_hash?.slice(0, 8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 