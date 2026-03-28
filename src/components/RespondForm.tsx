import { useState } from 'react';
import type { Candidate, Availability, Response } from '../types';
import { nanoid } from 'nanoid';

interface Props {
  candidates: Candidate[];
  busySlots: Set<string>; // candidateIds that are busy from Google Calendar
  onSubmit: (response: Response) => void;
  existingResponse?: Response;
}

const CYCLE: Availability[] = ['maru', 'sankaku', 'batsu'];
const DISPLAY: Record<Availability, { label: string; className: string }> = {
  maru: { label: '○', className: 'avail-maru' },
  sankaku: { label: '△', className: 'avail-sankaku' },
  batsu: { label: '×', className: 'avail-batsu' },
};

function formatCandidate(c: Candidate) {
  const d = new Date(c.date + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
  const time = c.startTime ? ` ${c.startTime}〜${c.endTime || ''}` : '';
  return dateStr + time;
}

export function RespondForm({ candidates, busySlots, onSubmit, existingResponse }: Props) {
  const [name, setName] = useState(existingResponse?.name || '');
  const [answers, setAnswers] = useState<Record<string, Availability>>(() => {
    if (existingResponse) return { ...existingResponse.answers };
    const init: Record<string, Availability> = {};
    candidates.forEach((c) => {
      init[c.id] = busySlots.has(c.id) ? 'batsu' : 'maru';
    });
    return init;
  });

  const toggle = (candidateId: string) => {
    setAnswers((prev) => {
      const current = prev[candidateId];
      const idx = CYCLE.indexOf(current);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      return { ...prev, [candidateId]: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      id: existingResponse?.id || nanoid(8),
      name: name.trim(),
      answers,
      updatedAt: Date.now(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">
          あなたの名前<span className="required">*</span>
        </label>
        <input
          className="form-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：山田"
          required
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label className="form-label">各候補の出欠（クリックで切替）</label>
        <div className="matrix-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>候補日</th>
                <th>出欠</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const avail = answers[c.id];
                const d = DISPLAY[avail];
                return (
                  <tr key={c.id}>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>
                      {formatCandidate(c)}
                      {busySlots.has(c.id) && (
                        <span style={{ fontSize: '0.7rem', color: '#dc2626', marginLeft: '6px' }}>
                          予定あり
                        </span>
                      )}
                    </td>
                    <td
                      className={`avail-cell ${d.className}`}
                      onClick={() => toggle(c.id)}
                    >
                      {d.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={!name.trim()}
      >
        {existingResponse ? '回答を更新' : '回答を送信'}
      </button>
    </form>
  );
}
