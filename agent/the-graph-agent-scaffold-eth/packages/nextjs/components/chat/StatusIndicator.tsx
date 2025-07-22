import { LoadingSpinner } from "./LoadingSpinner";

interface StatusIndicatorProps {
  status: string;
  onStop: () => void;
}

export function StatusIndicator({ status, onStop }: StatusIndicatorProps) {
  if (!(status === "submitted" || status === "streaming")) return null;

  return (
    <div className="flex justify-start">
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-sm">
        <div className="flex items-center space-x-3">
          {status === "submitted" ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <LoadingSpinner />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Processing your request...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Analyzing blockchain data</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">AI is responding...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Generating insights</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onStop}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                   bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 
                   dark:border-red-800 rounded-lg transition-all duration-200 hover:shadow-sm"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
