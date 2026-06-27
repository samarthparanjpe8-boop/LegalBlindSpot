import { useState, useEffect, Fragment } from 'react';
import AdvocateCard from './AdvocateCard';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import * as api from '../../services/api';
import { AlertTriangle, Trophy, ChevronUp, ChevronDown } from 'lucide-react';

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
    if (rank === 1) return { color: '#ffd700', fontWeight: 'bold' };
    if (rank === 2) return { color: '#c0c0c0', fontWeight: 'bold' };
    if (rank === 3) return { color: '#cd7f32', fontWeight: 'bold' };
    return {};
  }

  if (isLoading) {
    return (
      <div className="leaderboard-loading" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '40px', borderRadius: 'var(--radius-lg)' }}>
        <EmptyState icon={<AlertTriangle size={32} style={{ color: 'var(--danger)' }} />} heading="Failed to load" message={error} />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '40px', borderRadius: 'var(--radius-lg)' }}>
        <EmptyState icon={<Trophy size={32} style={{ color: 'var(--text-secondary)' }} />} heading="No advocates yet" message="Leaderboard data is not available." />
      </div>
    );
  }

  return (
    <div className="leaderboard" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 className="leaderboard-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trophy size={24} style={{ color: 'var(--accent)' }} /> Advocate Leaderboard
      </h2>

      <div className="leaderboard-table-wrapper" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Rank</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Name</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>City</th>
              <th
                className="leaderboard-sortable"
                onClick={() => setSortAsc(!sortAsc)}
                style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Trust Score
                  {sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Top Area</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Fee</th>
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
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--bg-primary)' : 'transparent',
                      transition: 'var(--transition)'
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <span className="leaderboard-rank" style={getRankStyle(rank)}>
                        #{rank}
                      </span>
                    </td>
                    <td className="leaderboard-name" style={{ padding: '16px 20px', fontWeight: '500', color: 'var(--text-primary)' }}>{adv.name}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{adv.city || '--'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className="leaderboard-score" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{adv.trustScore ?? '--'}</span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{adv.practiceAreas?.[0] || '--'}</td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>{adv.consultationFee != null ? `₹${adv.consultationFee.toLocaleString('en-IN')}` : '--'}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="leaderboard-expand-row" style={{ background: 'var(--bg-primary)' }}>
                      <td colSpan="6" style={{ padding: '24px 20px' }}>
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
