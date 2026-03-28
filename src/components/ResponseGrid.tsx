import type { Candidate, Response } from '../types';

interface Props {
  candidates: Candidate[];
  responses: Response[];
  finalizedCandidateId: string | null;
}

const DISPLAY: Record<string, { label: string; className: string }> = {
  maru: { label: '○', className: 'avail-maru' },
  sankaku: { label: '△', className: 'avail-sankaku' },
  batsu: { label: '×', className: 'avail-batsu' },
};

function formatCandidate(c: Candidate) {
  const d = new Date(c.date + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const dayStr = weekdays[d.getDay()];
  const time = c.startTime ? `${c.startTime}〜${c.endTime || ''}` : '';
  return { dateStr, dayStr, time };
}

export function ResponseGrid({ candidates, responses, finalizedCandidateId }: Props) {
  const maruCounts = candidates.map((c) =>
    responses.filter((r) => r.answers[c.id] === 'maru').length
  );

  return (
    <div className="matrix-wrapper">
      <table className="matrix-table">
        <thead>
          <tr>
            <th>参加者</th>
            {candidates.map((c) => {
              const f = formatCandidate(c);
              const isFinalized = c.id === finalizedCandidateId;
              return (
                <th
                  key={c.id}
                  style={isFinalized ? { background: '#dcfce7', color: '#16a34a' } : undefined}
                >
                  <div>{f.dateStr}({f.dayStr})</div>
                  {f.time && <div style={{ fontSize: '0.75rem', fontWeight: 400 }}>{f.time}</div>}
                  {isFinalized && <div style={{ fontSize: '0.7rem' }}>✓ 確定</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              {candidates.map((c) => {
                const avail = r.answers[c.id];
                const d = avail ? DISPLAY[avail] : null;
                return (
                  <td key={c.id} className={d?.className || 'avail-none'}>
                    {d?.label || '−'}
                  </td>
                );
              })}
            </tr>
          ))}
          {responses.length > 0 && (
            <tr className="summary-row">
              <td>○ 合計</td>
              {maruCounts.map((count, i) => (
                <td key={candidates[i].id}>{count}</td>
              ))}
            </tr>
          )}
          {responses.length === 0 && (
            <tr>
              <td colSpan={candidates.length + 1} style={{ color: '#9ca3af', padding: '24px' }}>
                まだ回答がありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
