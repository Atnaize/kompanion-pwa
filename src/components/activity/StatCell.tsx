interface StatCellProps {
  label: string;
  value: string;
  accent?: boolean;
}

export const StatCell = ({ label, value, accent }: StatCellProps) => {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={`truncate text-lg font-semibold ${accent ? 'text-strava-orange' : 'text-gray-900'}`}
      >
        {value}
      </div>
    </div>
  );
};
