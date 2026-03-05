interface Props {
  rows?: number;
  height?: string;
}

export default function CardSkeleton({ rows = 3, height = "h-32" }: Props) {
  return (
    <div className={`bento-card p-5 ${height} animate-pulse relative block`}>
      <div className="h-3 w-24 rounded bg-white/5 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/5 mb-3"
          style={{ width: `${70 + (i % 3) * 10}%`, opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}
