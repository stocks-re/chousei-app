import { useState } from 'react';
import type { Candidate, Response } from '../types';

interface Props {
  candidates: Candidate[];
  responses: Response[];
  eventTitle: string;
  onFinalize: (candidateId: string, registerCalendar: boolean) => void;
  onClose: () => void;
}

function formatCandidate(c: Candidate) {
  const d = new Date(c.date + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
  const time = c.startTime ? ` ${c.startTime}〜${c.endTime || ''}` : '';
  return dateStr + time;
}

export function FinalizeModal({ candidates, responses, onFinalize, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [registerCalendar, setRegisterCalendar] = useState(true);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const ranked = candidates
    .map((c) => ({
      candidate: c,
      maruCount: responses.filter((r) => r.answers[c.id] === 'maru').length,
      sankakuCount: responses.filter((r) => r.answers[c.id] === 'sankaku').length,
    }))
    .sort((a, b) => b.maruCount - a.maruCount || b.sankakuCount - a.sankakuCount);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>日程を確定する</h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '16px' }}>
          確定する日程を選択してください（○が多い順）
        </p>
        <ul className="finalize-list">
          {ranked.map(({ candidate, maruCount, sankakuCount }) => (
            <li
              key={candidate.id}
              className={`finalize-item ${selected === candidate.id ? 'selected' : ''}`}
              onClick={() => setSelected(candidate.id)}
            >
              <span>{formatCandidate(candidate)}</span>
              <span>
                <span className="count" style={{ marginRight: '8px' }}>○{maruCount}</span>
                <span style={{ color: '#d97706' }}>△{sankakuCount}</span>
              </span>
            </li>
          ))}
        </ul>

        {clientId && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={registerCalendar}
              onChange={(e) => setRegisterCalendar(e.target.checked)}
            />
            確定後にGoogleカレンダーに登録する
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selected}
            onClick={() => selected && onFinalize(selected, registerCalendar && !!clientId)}
          >
            この日程に確定
          </button>
        </div>
      </div>
    </div>
  );
}
