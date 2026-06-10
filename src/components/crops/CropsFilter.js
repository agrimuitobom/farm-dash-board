import React from 'react';

const CropsFilter = ({ filterText, seasonFilter, availableSeasons, onFilterTextChange, onSeasonFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[300px]">
        <input
          type="text"
          placeholder="作物名で検索..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-auto">
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={seasonFilter}
          onChange={(e) => onSeasonFilterChange(e.target.value)}
        >
          <option value="">全てのシーズン</option>
          {availableSeasons.map(season => (
            <option key={season} value={season}>{season}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CropsFilter;