import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '../lib/firebase';
import { Header } from '../components/Header';
import type { Candidate } from '../types';

export function CreateEvent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addCandidate = () => {
    if (!dateInput) return;
    const candidate: Candidate = {
      id: nanoid(8),
      date: dateInput,
      startTime: startTime || null,
      endTime: endTime || null,
    };
    setCandidates((prev) => [...prev, candidate]);
    setStartTime('');
    setEndTime('');
  };

  const removeCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const formatCandidate = (c: Candidate) => {
    const d = new Date(c.date + 'T00:00:00');
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const label = `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
    if (c.startTime && c.endTime) return `${label} ${c.startTime}〜${c.endTime}`;
    if (c.startTime) return `${label} ${c.startTime}〜`;
    return label;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !creatorName.trim() || candidates.length === 0) return;
    setSubmitting(true);

    try {
      const eventId = nanoid(10);
      const ref = doc(collection(db, 'events'), eventId);
      await setDoc(ref, {
        title: title.trim(),
        description: description.trim(),
        creatorName: creatorName.trim(),
        candidates,
        responses: [],
        finalizedCandidateId: null,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate(`/event/${eventId}`);
    } catch (err) {
      console.error(err);
      alert('イベントの作成に失敗しました。Firebase の設定を確認してください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="card">
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '24px' }}>
            新しいイベントを作成
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                イベント名<span className="required">*</span>
              </label>
              <input
                className="form-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：チーム定例ミーティング"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">あなたの名前<span className="required">*</span></label>
              <input
                className="form-input"
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="例：田中"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">メモ（任意）</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="補足事項があれば記入してください"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                候補日時<span className="required">*</span>
              </label>

              {candidates.length > 0 && (
                <div className="date-picker-grid">
                  {candidates.map((c) => (
                    <div key={c.id} className="candidate-chip">
                      {formatCandidate(c)}
                      <button type="button" onClick={() => removeCandidate(c.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="add-date-row">
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                    日付
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                    開始（任意）
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '2px' }}>
                    終了（任意）
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCandidate}>
                  追加
                </button>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting || !title.trim() || !creatorName.trim() || candidates.length === 0}
              >
                {submitting ? '作成中...' : 'イベントを作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
