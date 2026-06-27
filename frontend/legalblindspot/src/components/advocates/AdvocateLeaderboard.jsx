import { useState, useEffect, Fragment } from 'react';
import AdvocateCard from './AdvocateCard';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import * as api from '../../services/api';

export default function AdvocateLeaderboard() {
  const [advocates, setAdvocates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    api.getLeaderboard()
      .then(data => {
        setAdvocates(Array.isArray(data) ? data : data.advocates || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const sorted = [...advocates].sort((a, b) => {
    const sa = a.trustScore ?? 0;
    const sb = b.trustScore ?? 0;
    return sortAsc ? sa - sb : sb - sa;
  });

  function getRankStyle(rank) {
    if (rank === 1) return { color: '#ffd700' };
    if (rank === 2) return { color: '#c0c0c0' };
    if (rank === 3) return { color: '#cd7f32' };
    return {};
  }

  if (isLoading) {
    return (
      <div className="leaderboard-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return <EmptyState icon="!" heading="Failed to load" message={error} />;
  }

  if (sorted.length === 0) {
    return <EmptyState icon="T" heading="No advocates yet" message="Leaderboard data is not available." />;
  }

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">Advocate Leaderboard</h2>

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>City</th>
              <th
                className="leaderboard-sortable"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Trust Score {sortAsc ? '^' : 'v'}
              </th>
              <th>Top Area</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((adv, i) => {
              const rank = i + 1;
              const isExpanded = expandedId === (adv._id || adv.id || i);
              return (
                <Fragment key={adv._id || adv.id || i}>
                  <tr
                    className={`leaderboard-row ${isExpanded ? 'leaderboard-row-active' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : (adv._id || adv.id || i))}
                  >
                    <td>
                      <span className="leaderboard-rank" style={getRankStyle(rank)}>
                        #{rank}
                      </span>
                    </td>
                    <td className="leaderboard-name">{adv.name}</td>
                    <td>{adv.city || '--'}</td>
                    <td>
                      <span className="leaderboard-score">{adv.trustScore ?? '--'}</span>
                    </td>
                    <td>{adv.practiceAreas?.[0] || '--'}</td>
                    <td>{adv.consultationFee != null ? `Rs. ${adv.consultationFee}` : '--'}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="leaderboard-expand-row">
                      <td colSpan="6">
                        <AdvocateCard advocate={adv} compact={false} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
