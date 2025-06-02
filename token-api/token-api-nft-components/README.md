# Token-API NFT React Components

A super-lightweight set of **five** React components that surface common NFT data from the [Token API](https://token-api.thegraph.com/).  
Each component lives in a single file, has **zero runtime dependencies** (besides `react`) and can be copy-pasted straight into any React project.

## Components

| Component | Description | API Docs |
|-----------|-------------|----------|
| `ActivityFeed.jsx` | Latest mints / transfers / burns for a collection | [API →](https://token-api.service.pinax.network/#tag/evm/GET/nft/activities/evm) |
| `CollectionStatsBadge.jsx` | High-level stats for a collection (supply, owners, transfers) | [API →](https://token-api.service.pinax.network/#tag/evm/GET/nft/collections/evm/%7Bcontract%7D) |
| `NFTTopHolders.jsx` | Top addresses ranked by number of tokens held | [API →](https://token-api.service.pinax.network/#tag/evm/GET/nft/holders/evm/%7Bcontract%7D) |
| `NFTWalletHoldings.jsx` | All NFTs owned by a wallet | [API →](https://token-api.service.pinax.network/#tag/evm/GET/nft/ownerships/evm/%7Baddress%7D) |
| `RecentMintsTable.jsx` | Recent mint events for a collection | [API →](https://token-api.service.pinax.network/#tag/evm/GET/nft/activities/evm) |

## Quick Start (2 minutes)

1. **Get your JWT Token**
   - Visit [The Graph Marketplace](https://marketplace.thegraph.com/)
   - Get your JWT token for authenticated API access
   - Higher rate limits than public endpoints

2. **Create `.env` file in your project root:**
   ```bash
   # .env
   VITE_TOKEN_API_JWT_KEY=your_jwt_token_here  # For Vite
   # or
   REACT_APP_TOKEN_API_JWT_KEY=your_jwt_token_here  # For Create React App
   ```

3. **Copy & Use Components**
   ```jsx
   // Example: App.jsx
   import ActivityFeed from "./components/ActivityFeed";
   import CollectionStatsBadge from "./components/CollectionStatsBadge";
   
   export default function App() {
     return (
       <div>
         <CollectionStatsBadge />
         <ActivityFeed />
       </div>
     );
   }
   ```

## Example Contract Addresses

Try these example addresses to see the components in action:

- **NFT Collection:** `0xbd3531da5cf5857e7cfaa92426877b022e612cf8` (Pudgy Penguins)
- **Wallet Address:** `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (vitalik.eth)

## Features

- 🔒 Secure authentication with JWT
- 🚀 Zero dependencies (just React)
- 📱 Responsive & mobile-friendly
- 🎨 Clean, minimal styling
- 🔗 Direct links to API docs
- ⚡ Instant copy & paste setup

## Component Features

Each component includes:
- Pre-filled example addresses
- Loading & error states
- Network selection (mainnet active, others coming soon)
- Direct links to API documentation
- Clean, minimal styling that's easy to customize

## Environment Setup

The components support both Vite and Create React App:

```bash
# For Vite projects
VITE_TOKEN_API_JWT_KEY=your_jwt_token_here

# For Create React App projects
REACT_APP_TOKEN_API_JWT_KEY=your_jwt_token_here
```

## API Documentation

Each component links directly to its API documentation. Click the "API Docs ↗" link in any component's header to view the full API details. 