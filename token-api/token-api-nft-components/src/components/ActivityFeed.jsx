import React, { useState, useEffect } from "react";

// API Documentation: https://token-api.service.pinax.network/#tag/evm/GET/nft/activities/evm
// Provides NFT Activities (ex: transfers, mints & burns)

// One environment variable to configure (optional)
const JWT = import.meta.env.VITE_TOKEN_API_JWT_KEY;
console.log('JWT available:', !!JWT); // Debug if JWT exists
const API_BASE = "https://token-api.thegraph.com/";

// Simple fetch helper – no external libs
async function tokenFetch(path, params = {}) {
  const url = new URL(path.startsWith("/") ? path.slice(1) : path, API_BASE);
  
  // Only add params if they are provided (to match curl command exactly)
  if (Object.keys(params).length > 0) {
    Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  }

  const headers = { Accept: "application/json" };
  console.log('Using JWT:', !!JWT); // Debug JWT usage
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

export default function ActivityFeed() {
  const [contract, setContract] = useState("0xbd3531da5cf5857e7cfaa92426877b022e612cf8"); // Set default contract
  const [network, setNetwork] = useState("mainnet");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActivities = () => {
    if (!contract) return;
    const normalizedAddress = contract.toLowerCase();
    setLoading(true);
    setError(null);
    console.log('Fetching activities for contract:', normalizedAddress);

    // Match the exact endpoint from curl command
    tokenFetch("nft/activities/evm", { 
      contract: normalizedAddress
    })
      .then((json) => {
        console.log('Activity response:', json);
        setActivities(Array.isArray(json) ? json : (json.data || []));
      })
      .catch(err => {
        console.error('Activity error:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchActivities();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>NFT Activity Feed</h3>
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
        <button onClick={fetchActivities}>Fetch</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {!loading && !error && activities.length === 0 && contract && <p>No activity found.</p>}

      {activities.length > 0 && (
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Type</th>
              <th style={{ textAlign: "left" }}>Time</th>
              <th style={{ textAlign: "left" }}>Token</th>
              <th style={{ textAlign: "left" }}>From</th>
              <th style={{ textAlign: "left" }}>To</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => (
              <tr key={`${a.tx_hash}-${i}`}>
                <td>{a["@type"]}</td>
                <td>{formatAgo(a.timestamp)}</td>
                <td>#{a.token_id}</td>
                <td>{a.from?.slice(0, 6)}…</td>
                <td>{a.to?.slice(0, 6)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 