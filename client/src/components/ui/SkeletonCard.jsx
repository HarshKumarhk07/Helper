export default function SkeletonCard() {
  return (
    <div className="card-rounded">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}
