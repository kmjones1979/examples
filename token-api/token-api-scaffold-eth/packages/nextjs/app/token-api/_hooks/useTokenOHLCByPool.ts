"use client";

import { useTokenApi } from "./useTokenApi";
import type { NetworkId } from "./useTokenApi";
import { cleanContractAddress } from "~~/app/token-api/_utils/utils";

/**
 * OHLC data point
 */
export interface OHLCDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume_token0: number;
  volume_token1: number;
  volume_usd?: number;
}

/**
 * Pool OHLC API response
 */
export interface PoolOHLCResponse {
  // Core data fields
  ohlc?: OHLCDataPoint[];

  // Pool metadata
  pool_address?: string;
  token0_address?: string;
  token0_symbol?: string;
  token0_name?: string;
  token0_decimals?: number;
  token1_address?: string;
  token1_symbol?: string;
  token1_name?: string;
  token1_decimals?: number;
  protocol?: string;
  network_id?: string;
  resolution?: string;

  // Pagination
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
  };

  // Alternative API format
  data?: Array<{
    timestamp?: number;
    datetime?: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    volume_token0?: number;
    volume_token1?: number;
    volume_usd?: number;
  }>;

  // Statistics info
  statistics?: {
    token0_symbol?: string;
    token0_address?: string;
    token1_symbol?: string;
    token1_address?: string;
    protocol?: string;
    elapsed?: number;
    rows_read?: number;
    bytes_read?: number;
  };

  // Additional fields that might be in the response
  results?: number;
  total_results?: number;
}

/**
 * Parameters for pool OHLC API call
 */
export interface PoolOHLCParams {
  network_id?: NetworkId;
  from_timestamp?: number;
  to_timestamp?: number;
  resolution?: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1d" | "1w";
  page?: number;
  page_size?: number;
  token_address?: string;
}

/**
 * Options for useTokenOHLCByPool hook
 */
export interface UseTokenOHLCByPoolOptions {
  /**
   * Pool address to get OHLC data for
   */
  pool?: string;

  /**
   * Network ID
   */
  network_id?: NetworkId;

  /**
   * Start timestamp (in seconds)
   */
  from_timestamp?: number;

  /**
   * End timestamp (in seconds)
   */
  to_timestamp?: number;

  /**
   * Data resolution
   */
  resolution?: "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "1d" | "1w";

  /**
   * Page number for pagination
   */
  page?: number;

  /**
   * Page size for pagination
   */
  page_size?: number;

  /**
   * Enable/disable the query
   */
  enabled?: boolean;
}

/**
 * Hook to fetch OHLC price data for a liquidity pool
 *
 * @param options - Configuration options for the hook
 * @returns API response with OHLC data and helper functions
 */
export function useTokenOHLCByPool(pool: string | undefined, params?: PoolOHLCParams, options = { skip: false }) {
  // Normalize and clean the pool address
  const normalizedPool = pool ? cleanContractAddress(pool) : undefined;

  // Default skip to true if no pool address is provided
  const skip = options.skip || !normalizedPool;

  // Create the endpoint path
  const endpoint = normalizedPool ? `ohlc/pools/evm/${normalizedPool}` : "";

  // Call the base API hook with the proper configuration
  return useTokenApi<PoolOHLCResponse>(endpoint, { ...params }, { ...options, skip });
}

/**
 * Alternative function signature with options object
 */
export function useTokenOHLCByPoolWithOptions(options: UseTokenOHLCByPoolOptions = {}) {
  const {
    pool,
    network_id,
    from_timestamp,
    to_timestamp,
    resolution = "1d",
    page,
    page_size,
    enabled = true,
  } = options;

  // Normalize and clean the pool address
  const normalizedPool = pool ? cleanContractAddress(pool) : undefined;

  // Create the endpoint path
  const endpoint = normalizedPool ? `ohlc/pools/evm/${normalizedPool}` : "";

  // Call the base API hook with the proper configuration
  return useTokenApi<PoolOHLCResponse>(
    endpoint,
    {
      network_id,
      from_timestamp,
      to_timestamp,
      resolution,
      page,
      page_size,
    },
    {
      skip: !normalizedPool || !enabled,
    },
  );
}
