import React, { useState } from "react";

// API Documentation: https://token-api.service.pinax.network/#tag/evm/GET/nft/holders/evm/%7Bcontract%7D
// Provides NFT holders per contract

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

export default function NFTTopHolders() {
  const [contract, setContract] = useState("0xbd3531da5cf5857e7cfaa92426877b022e612cf8");
  const [network, setNetwork] = useState("mainnet");
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHolders = () => {
    if (!contract) return;
    const normalizedContract = contract.toLowerCase();
    setLoading(true);
    setError(null);
    console.log('Fetching holders for contract:', normalizedContract);

    tokenFetch(`nft/holders/evm/${normalizedContract}`, { 
      network_id: network
    })
      .then((json) => {
        console.log('Holders response:', json);
        setHolders(Array.isArray(json.data) ? json.data : []);
      })
      .catch(err => {
        console.error('Holders error:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>NFT Top Holders</h3>
        <a 
          href="https://token-api.service.pinax.network/#tag/evm/GET/nft/holders/evm/%7Bcontract%7D"
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
        <button onClick={fetchHolders}>Fetch</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {!loading && !error && holders.length === 0 && contract && <p>No data.</p>}
      {holders.length > 0 && (
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Rank</th>
              <th style={{ textAlign: "left" }}>Address</th>
              <th style={{ textAlign: "left" }}>Quantity</th>
              <th style={{ textAlign: "left" }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {holders.map((h, i) => (
              <tr key={h.address}>
                <td>#{i + 1}</td>
                <td>{h.address?.slice(0, 8)}…</td>
                <td>{h.unique_tokens?.toLocaleString()}</td>
                <td>{(h.percentage * 100).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 