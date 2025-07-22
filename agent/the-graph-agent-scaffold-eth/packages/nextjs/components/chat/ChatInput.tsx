import { LoadingSpinner } from "./LoadingSpinner";

interface ChatInputProps {
  input: string;
  status: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ChatInput({ input, status, onSubmit, onChange }: ChatInputProps) {
  const isReady = ["ready", "error"].includes(status);
  const placeholder = isReady ? "Ask me anything about blockchain data..." : "AI is thinking...";

  return (
    <div className="p-6 bg-white dark:bg-gray-800">
      <form onSubmit={onSubmit} className="flex items-end space-x-4">
        <div className="flex-1 relative">
          <input
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            value={input}
            placeholder={placeholder}
            onChange={onChange}
            disabled={!isReady}
            style={{ minHeight: "48px" }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || !isReady}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                   disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-lg 
                   transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isReady ? (
            <span className="flex items-center space-x-2">
              <span>Send</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </span>
          ) : (
            <LoadingSpinner />
          )}
        </button>
      </form>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const event = { target: { value: "Show me token transfers for USDC on Ethereum" } } as any;
            onChange(event);
          }}
          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Token Transfers
        </button>
        <button
          type="button"
          onClick={() => {
            const event = { target: { value: "Search for subgraphs related to DeFi" } } as any;
            onChange(event);
          }}
          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Subgraph Search
        </button>
        <button
          type="button"
          onClick={() => {
            const event = { target: { value: "Get token balances for 0x123..." } } as any;
            onChange(event);
          }}
          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Token Balances
        </button>
      </div>
    </div>
  );
}
