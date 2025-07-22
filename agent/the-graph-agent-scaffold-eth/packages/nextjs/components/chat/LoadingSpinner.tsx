interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "blue" | "purple";
}

export function LoadingSpinner({ size = "md", color = "blue" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  const colorClasses = {
    white: "border-white",
    blue: "border-blue-500",
    purple: "border-purple-500",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-2 border-transparent ${sizeClasses[size]} ${colorClasses[color]} border-t-current`}
      ></div>
    </div>
  );
}
