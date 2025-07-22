import { Chain } from "viem";
import { foundry } from "viem/chains";

interface TransactionProps {
  hash: string;
  chain: Chain;
}

export function Transaction({ hash, chain }: TransactionProps) {
  const explorerUrl =
    chain.id === foundry.id ? `blockexplorer/transaction/${hash}` : `${chain.blockExplorers?.default.url}/tx/${hash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 font-mono text-xs bg-gradient-to-r from-blue-50 to-purple-50 
               dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 
               dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 border border-blue-200 
               dark:border-blue-800 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm
               text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
    >
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
      <span className="font-medium">
        {hash.slice(0, 6)}...{hash.slice(-4)}
      </span>
    </a>
  );
}
