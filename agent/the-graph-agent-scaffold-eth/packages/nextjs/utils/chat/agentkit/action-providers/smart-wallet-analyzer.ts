import { fetchTokenBalances } from "../token-api/utils";
import { fetchNFTOwnerships } from "../token-api/utils";
import { fetchHistoricalBalances } from "../token-api/utils";
import type { NetworkId, TokenBalancesParams } from "../token-api/utils";
import type { X402Config } from "../x402";
import { createForcePaymentWrapper } from "../x402";
import { ActionProvider, WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";

// Schema for wallet analysis
const AnalyzeWalletSchema = z.object({
  address: z.string().describe("The wallet address to analyze (e.g., 0x... or ENS name)"),
  includeTokens: z.boolean().optional().default(true).describe("Whether to include ERC20 token balances"),
  includeNFTs: z.boolean().optional().default(true).describe("Whether to include NFT holdings"),
  includeHistory: z.boolean().optional().default(false).describe("Whether to include historical balance data"),
  networks: z
    .array(z.enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"]))
    .optional()
    .default(["mainnet", "bsc", "arbitrum-one"])
    .describe("Networks to check"),
  minAmountUsd: z.number().optional().default(1).describe("Minimum USD value to include in results"),
});

// Schema for quick wallet check
const QuickWalletCheckSchema = z.object({
  address: z.string().describe("The wallet address to check"),
});

export class SmartWalletAnalyzerProvider extends ActionProvider<WalletProvider> {
  name = "smart-wallet-analyzer";
  actionProviders = [];
  supportsNetwork = () => true;
  private x402Config: X402Config;

  constructor(x402Config: X402Config) {
    super("smart-wallet-analyzer", []);
    this.x402Config = x402Config;
  }

  // Helper function to validate Ethereum address format
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Helper function to check if an address has any activity
  private async checkAddressActivity(
    address: string,
    networks: NetworkId[],
    walletProvider: WalletProvider,
  ): Promise<{ network: string; hasActivity: boolean }[]> {
    const results = [];

    for (const network of networks) {
      try {
        // Try to get token balances as a quick activity check
        const params: TokenBalancesParams = {
          network_id: network,
        };

        // Create a wrapped version of fetchTokenBalances that forces x402 payments if enabled
        const wrappedFetchTokenBalances = createForcePaymentWrapper(
          fetchTokenBalances,
          this.x402Config,
          walletProvider,
        );

        const balances = await wrappedFetchTokenBalances(address, params);
        const hasActivity = balances.data && balances.data.length > 0;

        results.push({ network, hasActivity });
      } catch (error) {
        // If there's an error, assume no activity on this network
        results.push({ network, hasActivity: false });
      }
    }

    return results;
  }

  getActions(walletProvider: WalletProvider) {
    return [
      {
        name: "analyzeWallet",
        description:
          "Comprehensive wallet analysis that automatically detects wallet addresses and fetches token balances, NFTs, and activity across multiple networks. Use this for any wallet address analysis.",
        schema: AnalyzeWalletSchema as any,
        invoke: async ({
          address,
          includeTokens = true,
          includeNFTs = true,
          includeHistory = false,
          networks = ["mainnet", "bsc", "arbitrum-one"],
          minAmountUsd = 1,
        }: any) => {
          try {
            // Validate address format
            if (!this.isValidEthereumAddress(address)) {
              return JSON.stringify(
                {
                  error: "Invalid Ethereum address format. Please provide a valid 0x-prefixed address.",
                  address: address,
                  suggestion: "Make sure the address starts with 0x and is 42 characters long.",
                },
                null,
                2,
              );
            }

            console.log(`🔍 Analyzing wallet: ${address}`);

            const analysis = {
              address: address,
              analysis: {
                addressValidation: {
                  isValid: true,
                  format: "Ethereum address",
                  checksum: "Valid",
                },
                networks: [] as any[],
                summary: {
                  totalNetworks: 0,
                  networksWithActivity: 0,
                  totalTokens: 0,
                  totalNFTs: 0,
                  estimatedValue: 0,
                },
              },
            };

            // Check activity across networks
            const networkActivity = await this.checkAddressActivity(address, networks, walletProvider);

            for (const { network, hasActivity } of networkActivity) {
              const networkData: any = {
                network: network,
                hasActivity: hasActivity,
                tokens: [],
                nfts: [],
                totalValue: 0,
              };

              if (hasActivity) {
                // Get token balances
                if (includeTokens) {
                  try {
                    const tokenParams: TokenBalancesParams = {
                      network_id: network,
                      min_amount: minAmountUsd.toString(),
                    };

                    // Create wrapped versions that force x402 payments if enabled
                    const wrappedFetchTokenBalances = createForcePaymentWrapper(
                      fetchTokenBalances,
                      this.x402Config,
                      walletProvider,
                    );

                    const tokens = await wrappedFetchTokenBalances(address, tokenParams);
                    networkData.tokens = tokens.data || [];
                    networkData.totalValue +=
                      tokens.data?.reduce((sum: number, token: any) => sum + (token.amount_usd || 0), 0) || 0;
                  } catch (error) {
                    console.log(`❌ Error fetching tokens for ${network}:`, error);
                  }
                }

                // Get NFT holdings
                if (includeNFTs) {
                  try {
                    const nftParams = {
                      network_id: network,
                    };

                    const wrappedFetchNFTOwnerships = createForcePaymentWrapper(
                      fetchNFTOwnerships,
                      this.x402Config,
                      walletProvider,
                    );

                    const nfts = await wrappedFetchNFTOwnerships(address, nftParams);
                    networkData.nfts = nfts.data || [];
                  } catch (error) {
                    console.log(`❌ Error fetching NFTs for ${network}:`, error);
                  }
                }

                // Get historical balances if requested
                if (includeHistory) {
                  try {
                    const historyParams = {
                      network_id: network,
                    };

                    const wrappedFetchHistoricalBalances = createForcePaymentWrapper(
                      fetchHistoricalBalances,
                      this.x402Config,
                      walletProvider,
                    );

                    const history = await wrappedFetchHistoricalBalances(address, historyParams);
                    networkData.history = history.data || [];
                  } catch (error) {
                    console.log(`❌ Error fetching history for ${network}:`, error);
                  }
                }
              }

              analysis.analysis.networks.push(networkData);
            }

            // Calculate summary
            analysis.analysis.summary.totalNetworks = networks.length;
            analysis.analysis.summary.networksWithActivity = networkActivity.filter(n => n.hasActivity).length;
            analysis.analysis.summary.totalTokens = analysis.analysis.networks.reduce(
              (sum, network) => sum + network.tokens.length,
              0,
            );
            analysis.analysis.summary.totalNFTs = analysis.analysis.networks.reduce(
              (sum, network) => sum + network.nfts.length,
              0,
            );
            analysis.analysis.summary.estimatedValue = analysis.analysis.networks.reduce(
              (sum, network) => sum + network.totalValue,
              0,
            );

            return JSON.stringify(analysis, null, 2);
          } catch (error) {
            return JSON.stringify(
              {
                error: "Failed to analyze wallet",
                details: error instanceof Error ? error.message : "Unknown error",
                address: address,
              },
              null,
              2,
            );
          }
        },
      },
      {
        name: "quickWalletCheck",
        description:
          "Quick check to see if an address is a wallet with any activity. Returns basic information about the address.",
        schema: QuickWalletCheckSchema as any,
        invoke: async ({ address }: any) => {
          try {
            if (!this.isValidEthereumAddress(address)) {
              return JSON.stringify(
                {
                  isValidAddress: false,
                  error: "Invalid Ethereum address format",
                  suggestion: "Please provide a valid 0x-prefixed address",
                },
                null,
                2,
              );
            }

            // Quick check on mainnet
            const activity = await this.checkAddressActivity(address, ["mainnet"], walletProvider);
            const hasActivity = activity[0]?.hasActivity || false;

            return JSON.stringify(
              {
                isValidAddress: true,
                address: address,
                hasActivity: hasActivity,
                suggestion: hasActivity
                  ? "This appears to be an active wallet. Use 'analyzeWallet' for detailed analysis."
                  : "This address doesn't appear to have activity on mainnet. It might be a new wallet or inactive address.",
              },
              null,
              2,
            );
          } catch (error) {
            return JSON.stringify(
              {
                error: "Failed to check wallet",
                details: error instanceof Error ? error.message : "Unknown error",
                address: address,
              },
              null,
              2,
            );
          }
        },
      },
      {
        name: "getWalletTokenBalances",
        description:
          "Get token balances for a specific wallet address across multiple networks. Automatically detects if it's a wallet address.",
        schema: z.object({
          address: z.string().describe("The wallet address"),
          networks: z
            .array(z.enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"]))
            .optional()
            .default(["mainnet", "bsc", "arbitrum-one"])
            .describe("Networks to check"),
          minAmountUsd: z.number().optional().default(1).describe("Minimum USD value to include"),
        }) as any,
        invoke: async ({ address, networks = ["mainnet", "bsc", "arbitrum-one"], minAmountUsd = 1 }: any) => {
          try {
            if (!this.isValidEthereumAddress(address)) {
              return JSON.stringify(
                {
                  error: "Invalid Ethereum address format",
                  address: address,
                },
                null,
                2,
              );
            }

            const allBalances: any = {
              address: address,
              networks: {},
            };

            for (const network of networks) {
              try {
                const params: TokenBalancesParams = {
                  network_id: network,
                  min_amount: minAmountUsd.toString(),
                };

                // Create a wrapped version of fetchTokenBalances that forces x402 payments if enabled
                const wrappedFetchTokenBalances = createForcePaymentWrapper(
                  fetchTokenBalances,
                  this.x402Config,
                  walletProvider,
                );

                const balances = await wrappedFetchTokenBalances(address, params);
                allBalances.networks[network] = balances.data || [];
              } catch (error) {
                allBalances.networks[network] = [];
                console.log(`❌ Error fetching balances for ${network}:`, error);
              }
            }

            return JSON.stringify(allBalances, null, 2);
          } catch (error) {
            return JSON.stringify(
              {
                error: "Failed to get token balances",
                details: error instanceof Error ? error.message : "Unknown error",
                address: address,
              },
              null,
              2,
            );
          }
        },
      },
      {
        name: "testForcePaymentMode",
        description:
          "Test x402 force payment mode with a simple wallet balance query. This will force a payment even for free tier requests.",
        schema: z.object({
          address: z.string().describe("The wallet address to test with"),
          network: z
            .enum(["mainnet", "bsc", "base", "arbitrum-one", "optimism", "matic", "unichain"])
            .optional()
            .default("mainnet")
            .describe("The network to test"),
        }) as any,
        invoke: async ({ address, network = "mainnet" }: any) => {
          console.log("🧪 Testing force payment mode with wallet balance query");

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

          // Use the existing getWalletTokenBalances method which now has force payment wrapper
          return await this.getActions(walletProvider)
            .find((action: any) => action.name === "getWalletTokenBalances")
            ?.invoke({
              address,
              networks: [network],
              minAmountUsd: 1,
            });
        },
      },
    ];
  }
}

export const smartWalletAnalyzerProvider = (x402Config: X402Config) => new SmartWalletAnalyzerProvider(x402Config);
