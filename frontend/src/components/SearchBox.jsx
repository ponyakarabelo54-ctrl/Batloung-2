export default function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-box">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value && (
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onChange('')}>Clear</button>
      )}
    </div>
  );
}
