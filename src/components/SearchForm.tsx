import { useState } from 'react';

interface SearchFormProps {
  onSearch: (branch: string, budget: number) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [branch, setBranch] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(branch, Number(budget));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Search by branch..."
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <input
          type="number"
          placeholder="Maximum budget..."
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Search
      </button>
    </form>
  );
}