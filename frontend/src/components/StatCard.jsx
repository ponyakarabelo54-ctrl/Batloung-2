export default function StatCard({ label, value, hint, tone = 'green' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}
