"use client";

import { cleanContractAddress } from "../_utils/utils";
import type { NetworkId } from "./useTokenApi";
import { useTokenApi } from "./useTokenApi";

export interface TokenDetailsResponse {
  /**
   * Token address
   */
  address: string;
  /**
   * Token name
   */
  name?: string;
  /**
   * Token symbol
   */
  symbol?: string;
  /**
   * Token decimals
   */
  decimals?: number;
  /**
   * Token network
   */
  network?: string;
}

export interface UseTokenDetailsOptions {
  /**
   * The contract address of the token to get details for.
   */
  contract?: string;
  /**
   * The network to get token details for.
   */
  network?: NetworkId;
  /**
   * Enable the query
   */
  enabled?: boolean;
}

/**
 * React hook to get token details
 */
export function useTokenDetails(options: UseTokenDetailsOptions = {}) {
  const { contract, network, enabled = true } = options;

  const normalizedContract = contract ? cleanContractAddress(contract) : "";

  // Create a valid endpoint path string
  const endpoint = normalizedContract ? `tokens/evm/${normalizedContract}` : "";

  return useTokenApi<TokenDetailsResponse>(
    endpoint,
    {
      network_id: network,
    },
    {
      skip: !normalizedContract || !enabled,
    },
  );
}
