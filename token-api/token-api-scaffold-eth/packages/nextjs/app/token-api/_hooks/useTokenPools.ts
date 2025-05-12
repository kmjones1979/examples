"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";

/**
 * Token information in pool
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

/**
 * Pool information
 */
export interface Pool {
  block_num: number;
  datetime: string;
  transaction_id: string;
  factory: string;
  pool: string;
  token0: TokenInfo;
  token1: TokenInfo;
  fee: number;
  protocol: string;
  network_id: string;
}

/**
 * Pools API response
 */
export interface PoolsResponse {
  data: Pool[];
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination: {
    previous_page: number;
    current_page: number;
    next_page: number;
    total_pages: number;
  };
  results: number;
  total_results: number;
  request_time: string;
  duration_ms: number;
}

/**
 * Parameters for pools API call
 */
export interface PoolsParams {
  network_id?: NetworkId;
  token?: string;
  pool?: string;
  symbol?: string;
  factory?: string;
  protocol?: string;
  page?: number;
  page_size?: number;
  sort_by?: "tvl" | "creation_date";
  sort_direction?: "asc" | "desc";
  include_reserves?: boolean;
}

/**
 * Hook to fetch pools data
 *
 * @param params - Optional parameters
 * @param options - Hook options
 * @returns Pools data and functions
 */
export const useTokenPools = (params?: PoolsParams, options = {}) => {
  return useTokenApi<PoolsResponse>("pools/evm", { ...params }, options);
};
