import { useState } from "react";
import { Transaction } from "./Transaction";
import { foundry } from "viem/chains";

interface ToolCallsProps {
  toolParts: any[];
  messageId: string;
}

export function MessageToolCalls({ toolParts, messageId }: ToolCallsProps) {
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const toggleToolExpansion = (id: string) => {
    setExpandedTools(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!toolParts.length) return null;

  // Find any transaction hashes to display
  const transactionParts = toolParts.filter(
    part => part.toolInvocation.toolName === "showTransaction" && part.toolInvocation.result?.transactionHash,
  );

  return (
    <div className="mt-4 space-y-3">
      {/* Always show transactions */}
      {transactionParts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transactionParts.map((part, index) => (
            <Transaction key={index} hash={part.toolInvocation.result.transactionHash} chain={foundry} />
          ))}
        </div>
      )}

      {/* Tool calls section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => toggleToolExpansion(messageId)}
          className="w-full flex items-center justify-between text-left hover:bg-white dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Tool Calls</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{toolParts.length} operations performed</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${expandedTools[messageId] ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedTools[messageId] && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            {toolParts.map((part: any, index: number) => (
              <div
                key={`tool-${index}`}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {part.toolInvocation.toolName}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Arguments */}
                  {Object.entries(part.toolInvocation.args).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Arguments
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(part.toolInvocation.args).map(([key, value]) => (
                          <div key={key} className="flex items-start space-x-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-0 flex-shrink-0">
                              {key}:
                            </span>
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1 break-all">
                              {String(value)}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {part.toolInvocation.result && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Result
                      </h4>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all border border-gray-200 dark:border-gray-600">
                        {JSON.stringify(part.toolInvocation.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
