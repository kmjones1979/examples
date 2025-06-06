# The Graph MCP Usage Examples

This document provides examples of how to interact with The Graph's Model Context Protocol (MCP) through the chat interface.

## MCP Actions Available

### 1. Search Subgraphs

Find relevant subgraphs by keyword

**Example queries:**

- "Find subgraphs related to Uniswap"
- "Search for DeFi lending subgraphs"
- "Show me NFT marketplace subgraphs"

### 2. Get Contract Subgraphs

Find subgraphs that index a specific contract address

**Example queries:**

- "Find subgraphs for contract 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 on mainnet" (UNI token)
- "What subgraphs index the USDC contract on Ethereum?"
- "Show me subgraphs for Compound's cUSDC contract"

### 3. Get Subgraph Schema

Understand what data is available in a subgraph

**Example queries:**

- "Show me the schema for subgraph 5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
- "What entities are available in the Uniswap V3 subgraph?"
- "Get the schema for the Aave subgraph"

### 4. Execute MCP Query

Run GraphQL queries through MCP

**Example queries:**

- "Query the top 10 Uniswap pools by volume using MCP"
- "Get recent swaps from Uniswap V3 subgraph via MCP"
- "Show me liquidations from Aave using MCP query"

## Sample Chat Interactions

### Discovery Workflow

```
User: "I want to analyze USDC liquidity across different protocols"
```
