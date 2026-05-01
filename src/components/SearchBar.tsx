interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
}

function SearchBar({ query, onQueryChange }: SearchBarProps) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 px-4 py-3">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search conversations"
        className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
      />
    </div>
  );
}

export default SearchBar;
