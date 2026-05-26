interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  style,
}: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function AiSkeleton() {
  return (
    <div className="ai-skeleton">
      <div className="ai-skeleton-header">
        <Skeleton width="140px" height="1.25rem" />
        <Skeleton width="80px" height="1.5rem" borderRadius="999px" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="ai-skeleton-card">
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="100%" height="0.75rem" />
          <Skeleton width="85%" height="0.75rem" />
          <Skeleton
            width="70px"
            height="1.25rem"
            borderRadius="999px"
            style={{ marginTop: '0.5rem' }}
          />
        </div>
      ))}
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="results-skeleton">
      <div className="results-skeleton-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="results-skeleton-card">
            <Skeleton width="60%" height="0.75rem" />
            <Skeleton width="80%" height="1.75rem" style={{ marginTop: '0.5rem' }} />
          </div>
        ))}
      </div>
      <Skeleton width="100%" height="12rem" style={{ marginTop: '1.5rem' }} />
      <Skeleton width="100%" height="8rem" style={{ marginTop: '1rem' }} />
    </div>
  );
}
