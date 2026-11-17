export const Progress = ({ value, className = "" }: { value: number; className?: string }) => (
  <div className={`progress-clay w-full overflow-hidden ${className}`}>
    <div
      className="progress-clay-fill h-full transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);