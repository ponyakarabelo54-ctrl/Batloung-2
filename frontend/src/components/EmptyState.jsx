export default function EmptyState({ loading, message = 'Nothing to show yet.' }) {
  return <div className="empty-state">{loading ? 'Loading...' : message}</div>;
}
