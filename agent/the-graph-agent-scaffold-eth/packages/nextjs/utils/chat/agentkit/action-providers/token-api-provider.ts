import {
  GetHistoricalBalancesAgentParamsSchema,
  GetNFTActivitiesAgentParamsSchema, // NFT schemas
  GetNFTCollectionsAgentParamsSchema,
  GetNFTHoldersAgentParamsSchema,
  GetNFTItemsAgentParamsSchema,
  GetNFTOwnershipsAgentParamsSchema,
  GetNFTSalesAgentParamsSchema,
  GetTokenDetailsAgentParamsSchema,
  GetTokenHoldersAgentParamsSchema,
  GetTokenMetadataAgentParamsSchema,
  GetTokenOHLCByContractAgentParamsSchema,
  GetTokenOHLCByPoolAgentParamsSchema,
  GetTokenPoolsAgentParamsSchema,
  GetTokenSwapsAgentParamsSchema,
  GetTokenTransfersAgentParamsSchema, // TokenBalanceSchema, // Not directly used in this file anymore for agent response type, but good for reference
  NetworkIdSchema,
  TokenBalancesParamsSchema,
} from "../token-api/schemas";
import { fetchTokenBalances } from "../token-api/utils";
import type { TokenBalancesParams } from "../token-api/utils";
import {
  fetchHistoricalBalances,
  fetchNFTActivities,
  fetchNFTCollections,
  fetchNFTHolders,
  fetchNFTItems,
  fetchNFTOwnerships,
  fetchNFTSales,
  fetchTokenDetails,
  fetchTokenHolders,
  fetchTokenMetadata,
  fetchTokenOHLCByContract,
  fetchTokenOHLCByPool,
  fetchTokenPools,
  fetchTokenSwaps,
  fetchTokenTransfers,
} from "../token-api/utils";
import type {
  ContractOHLCParams,
  HistoricalBalancesParams,
  PoolOHLCParams,
  PoolsParams,
  SwapsParams,
  TokenDetailsParams,
  TokenHoldersParams,
  TokenMetadataParams,
  TokenTransfersParams,
} from "../token-api/utils";
import type { X402Config } from "../x402";
import { createForcePaymentWrapper } from "../x402";
import { ActionProvider, CreateAction, Network, WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";

// Define the schema for the arguments the agent will provide for getTokenBalances
const GetTokenBalancesAgentParamsSchema = z.object({
  address: z
    .string()
    .describe("The wallet address (e.g., 0x... or ENS name). ENS names need prior resolution to an address."),
  networkId: NetworkIdSchema.optional().describe("Optional network ID to filter by (e.g., mainnet, bsc)."),
  contractAddresses: z
    .array(z.string())
    .optional()
    .describe("Optional list of specific token contract addresses to fetch."),
  minAmountUsd: z.number().optional().describe("Optional minimum USD value for a balance to be included."),
});

class TokenApiProvider extends ActionProvider<WalletProvider> {
  private x402Config: X402Config;

  constructor(x402Config: X402Config) {
    super(
      "token-api-provider",
      // Description (second arg) is not part of the base ActionProvider constructor based on common patterns.
      // The base ActionProvider constructor usually takes (name: string, tools: TTool[]).
      // Let's assume no specific tools are being injected into this provider itself.
      [], // Pass an empty array for tools if none are specifically associated with this provider instance
    );
    this.x402Config = x402Config;
  }

  // Implement the required supportsNetwork method
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  supportsNetwork = (network: Network): boolean => {
    // This provider is not network-specific in itself, as network is a parameter to its actions.
    // So, it supports all networks conceptually, or this can be made more specific if needed.
    return true;
  };

  async getTokenBalances(_walletProvider: WalletProvider, args: any): Promise<string> {
    // Agent handles x402 payments automatically - no validation needed here

    if (!args.address) {
      return "Error: Wallet address is required.";
    }

    const fetchParams: TokenBalancesParams = {
      network_id: args.networkId,
    };

    try {
      // Create a wrapped version of fetchTokenBalances that forces x402 payments if enabled
      const wrappedFetchTokenBalances = createForcePaymentWrapper(fetchTokenBalances, this.x402Config, _walletProvider);

      const response = await wrappedFetchTokenBalances(args.address, fetchParams);

      if (response.error) {
        return `Error fetching token balances: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || response.data.length === 0) {
        console.log(`[TokenApiProvider] No token balances found for address ${args.address}`);
        return `No token balances found for address ${args.address} ${args.networkId ? "on " + args.networkId : ""}.`;
      }

      let results = response.data;

      // Client-side filtering (post-fetch)
      if (args.contractAddresses && args.contractAddresses.length > 0) {
        const lowerCaseContracts = args.contractAddresses.map((c: string) => c.toLowerCase());
        results = results.filter(balance => lowerCaseContracts.includes(balance.contract_address.toLowerCase()));
      }
      if (args.minAmountUsd !== undefined) {
        results = results.filter(
          balance => balance.amount_usd !== undefined && balance.amount_usd >= args.minAmountUsd!,
        );
      }

      if (results.length === 0) {
        return `No token balances matched the specified criteria for address ${args.address}.`;
      }

      const formattedResults = results.map(b => ({
        token: b.symbol || b.name || b.contract_address,
        balance: b.amount,
        valueUSD: b.amount_usd?.toFixed(2),
        network: b.network_id,
      }));

      return JSON.stringify(formattedResults, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${errorMessage}`;
    }
  }

  async getTokenDetails(
    _walletProvider: WalletProvider, // Included for consistency with ActionProvider type
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenDetails, Args: ${JSON.stringify(args)}`);

    // Agent handles x402 payments automatically - no validation needed here

    if (!args.contractAddress) {
      return "Error: Contract address is required to get token details.";
    }

    // Assuming cleanContractAddress might be needed here too, or applied in fetchTokenDetails.
    // For now, pass as is. If cleanContractAddress is from a UI utility,
    // consider making a non-UI version available for agentkit utils or apply here.
    // const normalizedContract = cleanContractAddress(args.contractAddress); // Example if needed
    const normalizedContract = args.contractAddress; // Assuming it's already clean or handled by API/fetch util

    const fetchParams: TokenDetailsParams = {
      network_id: args.networkId,
    };

    try {
      // Create a wrapped version of fetchTokenDetails that forces x402 payments if enabled
      const wrappedFetchTokenDetails = createForcePaymentWrapper(fetchTokenDetails, this.x402Config, _walletProvider);

      const response = await wrappedFetchTokenDetails(normalizedContract, fetchParams);

      if (response.error) {
        return `Error fetching token details: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data) {
        return `No details found for contract ${args.contractAddress} ${args.networkId ? "on " + args.networkId : ""}.`;
      }

      // Format for the agent. Can be a summary or JSON string.
      // Adjust formatting as needed for the agent's consumption.
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenDetails action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getTokenTransfers(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    // Agent handles x402 payments automatically - no validation needed here

    if (!args.contractAddress) {
      return "Error: Contract address is required to get token transfers.";
    }

    if (!args.networkId) {
      return "Error: Network ID is required to get token transfers.";
    }

    const fetchParams: Omit<TokenTransfersParams, "to"> = {
      network_id: args.networkId,
      contract: args.contractAddress,
      limit: args.limit || 50,
    };

    if (args.fromAddress) {
      fetchParams.from = args.fromAddress;
    }

    if (args.limit) {
      fetchParams.limit = args.limit;
    }

    try {
      // Create a wrapped version of fetchTokenTransfers that forces x402 payments if enabled
      const wrappedFetchTokenTransfers = createForcePaymentWrapper(
        fetchTokenTransfers,
        this.x402Config,
        _walletProvider,
      );

      const response = await wrappedFetchTokenTransfers(args.toAddress || undefined, fetchParams);

      if (response.error) {
        return `Error fetching token transfers: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.transfers || response.data.transfers.length === 0) {
        return `No token transfers found for contract ${args.contractAddress} on network ${args.networkId}.`;
      }

      const formattedResults = response.data.transfers.map((transfer: any) => ({
        from: transfer.from,
        to: transfer.to,
        amount: transfer.amount,
        valueUSD: transfer.value_usd?.toFixed(2),
        transactionHash: transfer.transaction_id,
        blockNumber: transfer.block_num,
        timestamp: transfer.timestamp,
        network: transfer.network_id,
      }));

      return JSON.stringify(formattedResults, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${errorMessage}`;
    }
  }

  async getTokenMetadata(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenMetadata, Args: ${JSON.stringify(args)}`);

    // Agent handles x402 payments automatically - no validation needed here

    if (!args.contractAddress) {
      return "Error: Contract address is required to get token metadata.";
    }

    // Contract address normalization is handled by the fetchTokenMetadata utility
    const fetchParams: TokenMetadataParams = {
      network_id: args.networkId,
      include_market_data: args.includeMarketData,
    };

    try {
      const response = await fetchTokenMetadata(args.contractAddress, fetchParams);

      if (response.error) {
        return `Error fetching token metadata: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data) {
        return `No metadata found for contract ${args.contractAddress} ${args.networkId ? "on " + args.networkId : ""}.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenMetadata action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getTokenHolders(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenHolders, Args: ${JSON.stringify(args)}`);

    // Agent handles x402 payments automatically - no validation needed here

    if (!args.contractAddress) {
      return "Error: Contract address is required to get token holders.";
    }

    const fetchParams: TokenHoldersParams = {
      network_id: args.networkId,
      page: args.page,
      page_size: args.pageSize,
      include_price_usd: args.includePriceUsd,
    };

    try {
      // Contract address normalization is handled by the fetchTokenHolders utility
      const response = await fetchTokenHolders(args.contractAddress, fetchParams);

      if (response.error) {
        return `Error fetching token holders: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.holders || response.data.holders.length === 0) {
        return `No holders found for contract ${args.contractAddress} ${args.networkId ? "on " + args.networkId : ""}.`;
      }

      // response.data is TokenHoldersData, which includes the holders array and pagination/stats
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenHolders action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getTokenPools(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenPools, Args: ${JSON.stringify(args)}`);

    const { tokenAddress, poolAddress, ...otherFilters } = args;

    const fetchParams: PoolsParams = {
      ...otherFilters,
      token: tokenAddress,
      pool: poolAddress,
    };

    try {
      const response = await fetchTokenPools(fetchParams);

      if (response.error) {
        return `Error fetching token pools: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.data || response.data.data.length === 0) {
        let message = "No token pools found";
        if (tokenAddress) message += ` for token ${tokenAddress}`;
        if (poolAddress) message += ` for pool ${poolAddress}`;
        if (args.network_id) message += ` on ${args.network_id}`;
        message += ".";
        return message;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenPools action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getTokenSwaps(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenSwaps, Args: ${JSON.stringify(args)}`);

    // network_id is required by GetTokenSwapsAgentParamsSchema (inherited from SwapsParamsSchema)
    if (!args.network_id) {
      return "Error: Network ID is required to get token swaps.";
    }

    const { transactionHash, poolAddress, ...otherFilters } = args;

    const fetchParams: SwapsParams = {
      ...otherFilters, // Includes network_id, caller, sender, recipient, protocol, page, page_size
      tx_hash: transactionHash, // Map agent-friendly name to utility param name
      pool: poolAddress, // Map agent-friendly name to utility param name
    };

    try {
      const response = await fetchTokenSwaps(fetchParams);

      if (response.error) {
        return `Error fetching token swaps: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.swaps || response.data.swaps.length === 0) {
        let message = `No token swaps found on ${args.network_id}`;
        if (poolAddress) message += ` for pool ${poolAddress}`;
        if (transactionHash) message += ` for tx ${transactionHash}`;
        message += ".";
        return message;
      }

      // response.data is SwapsResponseData, includes swaps array and pagination/total
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenSwaps action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getTokenOHLCByContract(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenOHLCByContract, Args: ${JSON.stringify(args)}`);

    if (!args.contractAddress) {
      return "Error: Contract address is required to get OHLC data.";
    }

    const fetchParams: ContractOHLCParams = {
      network_id: args.networkId,
      resolution: args.resolution,
      from_timestamp: args.fromTimestamp,
      to_timestamp: args.toTimestamp,
      limit: args.limit,
    };

    try {
      // Contract address normalization is handled by the fetch utility
      const response = await fetchTokenOHLCByContract(args.contractAddress, fetchParams);

      if (response.error) {
        return `Error fetching OHLC data: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.ohlc || response.data.ohlc.length === 0) {
        let message = `No OHLC data found for contract ${args.contractAddress}`;
        if (args.networkId) message += ` on ${args.networkId}`;
        if (args.resolution) message += ` with ${args.resolution} resolution`;
        message += ".";
        return message;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenOHLCByContract action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getTokenOHLCByPool(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getTokenOHLCByPool, Args: ${JSON.stringify(args)}`);

    if (!args.poolAddress) {
      return "Error: Pool address is required to get pool OHLC data.";
    }

    const fetchParams: PoolOHLCParams = {
      network_id: args.networkId,
      resolution: args.resolution,
      from_timestamp: args.fromTimestamp,
      to_timestamp: args.toTimestamp,
      page: args.page,
      page_size: args.pageSize,
      token_address: args.tokenAddress,
    };

    try {
      // Pool address normalization is handled by the fetch utility
      const response = await fetchTokenOHLCByPool(args.poolAddress, fetchParams);

      if (response.error) {
        return `Error fetching pool OHLC data: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.ohlc || response.data.ohlc.length === 0) {
        let message = `No OHLC data found for pool ${args.poolAddress}`;
        if (args.networkId) message += ` on ${args.networkId}`;
        if (args.resolution) message += ` with ${args.resolution} resolution`;
        if (args.tokenAddress) message += ` involving token ${args.tokenAddress}`;
        message += ".";
        return message;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getTokenOHLCByPool action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getHistoricalBalances(
    _walletProvider: WalletProvider, // Included for consistency
    args: any,
  ): Promise<string> {
    console.log(`Action: getHistoricalBalances, Args: ${JSON.stringify(args)}`);

    if (!args.address) {
      return "Error: Wallet address is required to get historical balances.";
    }

    // Map agent params to utility params
    const fetchParams: HistoricalBalancesParams = {
      contract_address: args.contractAddress,
      network_id: args.networkId,
      from_timestamp: args.fromTimestamp,
      to_timestamp: args.toTimestamp,
      resolution: args.resolution,
    };

    try {
      // Address normalization is handled by the fetch utility
      const response = await fetchHistoricalBalances(args.address, fetchParams);

      if (response.error) {
        return `Error fetching historical balances: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.history || response.data.history.length === 0) {
        let message = `No historical balances found for address ${args.address}`;
        if (args.contractAddress) message += ` for token ${args.contractAddress}`;
        if (args.networkId) message += ` on ${args.networkId}`;
        message += ".";
        return message;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getHistoricalBalances action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  // --- NFT Actions ---

  async getNFTCollections(_walletProvider: WalletProvider, args: any): Promise<string> {
    console.log(`Action: getNFTCollections, Args: ${JSON.stringify(args)}`);

    // Agent handles x402 payments automatically - no validation needed here

    if (!args.contractAddress) {
      return "Error: Contract address is required to get NFT collection data.";
    }

    try {
      const response = await fetchNFTCollections(args.contractAddress, {
        network_id: args.networkId,
      });

      if (response.error) {
        return `Error fetching NFT collections: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || response.data.length === 0) {
        return `No NFT collection found for contract ${args.contractAddress}${args.networkId ? ` on ${args.networkId}` : ""}.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getNFTCollections action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getNFTItems(_walletProvider: WalletProvider, args: any): Promise<string> {
    console.log(`Action: getNFTItems, Args: ${JSON.stringify(args)}`);

    if (!args.contractAddress || !args.tokenId) {
      return "Error: Contract address and token ID are required to get NFT item details.";
    }

    try {
      const response = await fetchNFTItems(args.contractAddress, args.tokenId, {
        network_id: args.networkId,
      });

      if (response.error) {
        return `Error fetching NFT items: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || response.data.length === 0) {
        return `No NFT item found for contract ${args.contractAddress} token ID ${args.tokenId}${args.networkId ? ` on ${args.networkId}` : ""}.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getNFTItems action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getNFTSales(_walletProvider: WalletProvider, args: any): Promise<string> {
    console.log(`Action: getNFTSales, Args: ${JSON.stringify(args)}`);

    try {
      const response = await fetchNFTSales({
        network_id: args.networkId,
        any: args.any,
        offerer: args.offerer,
        recipient: args.recipient,
        contract: args.token,
        startTime: args.startTime,
        endTime: args.endTime,
        orderBy: args.orderBy,
        orderDirection: args.orderDirection,
        limit: args.limit,
        page: args.page,
      });

      if (response.error) {
        return `Error fetching NFT sales: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || response.data.length === 0) {
        return `No NFT sales found${args.networkId ? ` on ${args.networkId}` : ""} with the specified criteria.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getNFTSales action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getNFTHolders(_walletProvider: WalletProvider, args: any): Promise<string> {
    console.log(`Action: getNFTHolders, Args: ${JSON.stringify(args)}`);

    if (!args.contractAddress) {
      return "Error: Contract address is required to get NFT holders.";
    }

    try {
      const response = await fetchNFTHolders(args.contractAddress, {
        network_id: args.networkId,
        page: args.page,
        page_size: args.pageSize,
      });

      if (response.error) {
        return `Error fetching NFT holders: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || !response.data.data || response.data.data.length === 0) {
        return `No NFT holders found for contract ${args.contractAddress}${args.networkId ? ` on ${args.networkId}` : ""}.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getNFTHolders action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getNFTOwnerships(_walletProvider: WalletProvider, args: any): Promise<string> {
    console.log(`Action: getNFTOwnerships, Args: ${JSON.stringify(args)}`);

    if (!args.ownerAddress) {
      return "Error: Owner address is required to get NFT ownerships.";
    }

    try {
      const response = await fetchNFTOwnerships(args.ownerAddress, {
        network_id: args.networkId,
        contract: args.contractAddress,
      });

      if (response.error) {
        return `Error fetching NFT ownerships: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || response.data.length === 0) {
        return `No NFT ownerships found for address ${args.ownerAddress}${args.networkId ? ` on ${args.networkId}` : ""}${args.contractAddress ? ` for contract ${args.contractAddress}` : ""}.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getNFTOwnerships action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  async getNFTActivities(_walletProvider: WalletProvider, args: any): Promise<string> {
    console.log(`Action: getNFTActivities, Args: ${JSON.stringify(args)}`);

    try {
      const response = await fetchNFTActivities({
        network_id: args.networkId,
        contract: args.contractAddress,
        from: args.fromAddress,
        to: args.toAddress,
        token_id: args.tokenId,
        activity_type: args.activityType,
        startTime: args.startTime,
        endTime: args.endTime,
        limit: args.limit,
        page: args.page,
      });

      if (response.error) {
        return `Error fetching NFT activities: ${response.error.message} (Status: ${response.error.status})`;
      }

      if (!response.data || response.data.length === 0) {
        return `No NFT activities found${args.networkId ? ` on ${args.networkId}` : ""} with the specified criteria.`;
      }

      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error("Error in getNFTActivities action:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return `Error: ${message}`;
    }
  }

  getActions(walletProvider: WalletProvider) {
    return [
      {
        name: "getTokenBalances",
        description:
          "Get token balances for a wallet address. Use this for any wallet address to see their ERC20 token holdings.",
        schema: GetTokenBalancesAgentParamsSchema as any,
        invoke: async (args: any) => this.getTokenBalances(walletProvider, args),
      },
      {
        name: "getCommonTokenAddress",
        description:
          "Get the contract address for common tokens like USDC, ETH, etc. Use this to find token contract addresses.",
        schema: z.object({
          tokenName: z.string().describe("The token name (e.g., USDC, ETH, DAI, WETH)"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .describe("The network ID"),
        }) as any,
        invoke: async (args: any) => {
          const commonTokens: Record<string, Record<string, string>> = {
            mainnet: {
              USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
              DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
              USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
              WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
            },
            "arbitrum-one": {
              USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
              WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
              DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
              USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            },
            polygon: {
              USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
              WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
              USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            },
          };

          const { tokenName, networkId } = args;
          const networkTokens = commonTokens[networkId];

          if (!networkTokens) {
            return JSON.stringify(
              {
                error: `Network ${networkId} not supported for common token lookup`,
                supportedNetworks: Object.keys(commonTokens),
              },
              null,
              2,
            );
          }

          const address = networkTokens[tokenName.toUpperCase()];
          if (!address) {
            return JSON.stringify(
              {
                error: `Token ${tokenName} not found on ${networkId}`,
                availableTokens: Object.keys(networkTokens),
              },
              null,
              2,
            );
          }

          return JSON.stringify(
            {
              tokenName: tokenName.toUpperCase(),
              networkId,
              contractAddress: address,
            },
            null,
            2,
          );
        },
      },
      {
        name: "getTokenTransfers",
        description:
          "Get token transfers for a specific token contract. Use this to see transfer history for tokens like USDC, ETH, etc.",
        schema: z.object({
          contractAddress: z.string().describe("The token contract address (e.g., USDC contract address)"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .describe("The network ID"),
          fromAddress: z.string().optional().describe("Optional: Filter transfers from this address"),
          toAddress: z.string().optional().describe("Optional: Filter transfers to this address"),
          limit: z.number().optional().default(50).describe("Number of transfers to return (default: 50)"),
        }) as any,
        invoke: async (args: any) => this.getTokenTransfers(walletProvider, args),
      },
      {
        name: "getTokenDetails",
        description: "Get detailed information about a specific token contract.",
        schema: z.object({
          contractAddress: z.string().describe("The token contract address"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .describe("The network ID"),
          includeMarketData: z.boolean().optional().default(false).describe("Whether to include market data"),
        }) as any,
        invoke: async (args: any) => this.getTokenDetails(walletProvider, args),
      },
      {
        name: "getTokenMetadata",
        description: "Get metadata for a specific token contract.",
        schema: z.object({
          contractAddress: z.string().describe("The token contract address"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .describe("The network ID"),
          includeMarketData: z.boolean().optional().default(false).describe("Whether to include market data"),
        }) as any,
        invoke: async (args: any) => this.getTokenMetadata(walletProvider, args),
      },
      {
        name: "getTokenHolders",
        description: "Get token holders for a specific token contract.",
        schema: z.object({
          contractAddress: z.string().describe("The token contract address"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .describe("The network ID"),
          page: z.number().optional().default(1).describe("Page number"),
          pageSize: z.number().optional().default(20).describe("Number of holders per page"),
        }) as any,
        invoke: async (args: any) => this.getTokenHolders(walletProvider, args),
      },
      {
        name: "getHistoricalBalances",
        description: "Get historical token balances for a wallet address.",
        schema: z.object({
          address: z.string().describe("The wallet address"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .describe("The network ID"),
          timePeriod: z.string().optional().default("1d").describe("Time period (e.g., 1d, 7d, 30d)"),
        }) as any,
        invoke: async (args: any) => this.getHistoricalBalances(walletProvider, args),
      },
      {
        name: "testForcePayment",
        description:
          "Test x402 force payment mode with a simple token balance query. This will force a payment even for free tier requests.",
        schema: z.object({
          address: z.string().describe("The wallet address to test with"),
          networkId: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .optional()
            .default("mainnet")
            .describe("The network ID"),
        }) as any,
        invoke: async (args: any) => {
          console.log("🧪 Testing force payment mode with token balance query");

          if (!this.x402Config.forcePayment) {
            return JSON.stringify(
              {
                error: "Force payment mode is not enabled. Set X402_FORCE_PAYMENT=true in your environment variables.",
                currentConfig: {
                  enabled: this.x402Config.enabled,
                  forcePayment: this.x402Config.forcePayment,
                },
              },
              null,
              2,
            );
          }

          // Use the existing getTokenBalances method which now has force payment wrapper
          return await this.getTokenBalances(walletProvider, args);
        },
      },
    ];
  }
}

export const tokenApiProvider = (x402Config: X402Config) => new TokenApiProvider(x402Config);
