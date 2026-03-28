import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEvent } from '../hooks/useEvent';
import { Header } from '../components/Header';
import { ResponseGrid } from '../components/ResponseGrid';
import { RespondForm } from '../components/RespondForm';
import { ShareLink } from '../components/ShareLink';
import { FinalizeModal } from '../components/FinalizeModal';
import { GoogleCalendarButton } from '../components/GoogleCalendarButton';
import type { Response, Candidate } from '../types';

const CALENDAR_WRITE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

async function registerToGoogleCalendar(candidate: Candidate, eventTitle: string, description: string) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return;

  return new Promise<void>((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CALENDAR_WRITE_SCOPE,
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }
        try {
          const eventBody: Record<string, unknown> = {
            summary: eventTitle,
            description,
          };

          if (candidate.startTime && candidate.endTime) {
            eventBody.start = { dateTime: `${candidate.date}T${candidate.startTime}:00`, timeZone: 'Asia/Tokyo' };
            eventBody.end = { dateTime: `${candidate.date}T${candidate.endTime}:00`, timeZone: 'Asia/Tokyo' };
          } else {
            eventBody.start = { date: candidate.date };
            eventBody.end = { date: candidate.date };
          }

          const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          });

          if (!res.ok) throw new Error('Calendar API error');
          const data = await res.json();
          if (data.htmlLink) {
            window.open(data.htmlLink, '_blank');
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    });
    tokenClient.requestAccessToken();
  });
}

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, loading, error } = useEvent(eventId);
  const [showForm, setShowForm] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());
  const [editingResponse, setEditingResponse] = useState<Response | undefined>();

  const handleResponse = useCallback(async (response: Response) => {
    if (!event || !eventId) return;
    const ref = doc(db, 'events', eventId);
    const existing = event.responses.findIndex((r) => r.id === response.id);
    const updated = [...event.responses];
    if (existing >= 0) {
      updated[existing] = response;
    } else {
      updated.push(response);
    }
    await updateDoc(ref, { responses: updated, updatedAt: serverTimestamp() });
    setShowForm(false);
    setEditingResponse(undefined);
  }, [event, eventId]);

  const handleFinalize = useCallback(async (candidateId: string, registerCalendar: boolean) => {
    if (!eventId || !event) return;
    const ref = doc(db, 'events', eventId);
    await updateDoc(ref, {
      finalizedCandidateId: candidateId,
      status: 'finalized',
      updatedAt: serverTimestamp(),
    });
    setShowFinalize(false);

    if (registerCalendar) {
      const candidate = event.candidates.find((c) => c.id === candidateId);
      if (candidate) {
        try {
          await registerToGoogleCalendar(candidate, event.title, event.description || '');
        } catch (err) {
          console.error('Calendar registration failed:', err);
          alert('Googleカレンダーへの登録に失敗しました。手動で登録してください。');
        }
      }
    }
  }, [eventId, event]);

  const handleEdit = (response: Response) => {
    setEditingResponse(response);
    setShowForm(true);
  };

  const handleBusySlots = useCallback((slots: Set<string>) => {
    setBusySlots(slots);
  }, []);

  if (loading) return <><Header /><div className="loading">読み込み中...</div></>;
  if (error || !event) return <><Header /><div className="error-msg">{error || 'イベントが見つかりません'}</div></>;

  const finalized = event.status === 'finalized' && event.finalizedCandidateId;
  const finalizedCandidate = finalized
    ? event.candidates.find((c) => c.id === event.finalizedCandidateId)
    : null;

  return (
    <>
      <Header />
      <div className="container">
        {/* Event info */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '4px' }}>
            {event.title}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>
            作成者: {event.creatorName}
          </p>
          {event.description && (
            <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '12px' }}>
              {event.description}
            </p>
          )}

          {finalized && finalizedCandidate && (
            <div className="finalized-banner">
              <h3>日程が確定しました</h3>
              <p>
                {(() => {
                  const d = new Date(finalizedCandidate.date + 'T00:00:00');
                  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
                  let text = `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
                  if (finalizedCandidate.startTime) text += ` ${finalizedCandidate.startTime}〜${finalizedCandidate.endTime || ''}`;
                  return text;
                })()}
              </p>
            </div>
          )}

          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            共有リンク
          </div>
          <ShareLink eventId={event.id} />
        </div>

        {/* Response matrix */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
            回答一覧
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px' }}>
            {event.responses.length}人が回答済み
          </p>
          <ResponseGrid
            candidates={event.candidates}
            responses={event.responses}
            finalizedCandidateId={event.finalizedCandidateId}
          />

          {event.responses.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '6px' }}>回答を編集:</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {event.responses.map((r) => (
                  <button
                    key={r.id}
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(r)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {event.status === 'open' && (
          <div className="card" style={{ marginBottom: '20px' }}>
            {!showForm ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => { setEditingResponse(undefined); setShowForm(true); }}
                >
                  回答する
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowFinalize(true)}
                  disabled={event.responses.length === 0}
                >
                  日程を確定する
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {editingResponse ? `${editingResponse.name}の回答を編集` : '出欠を入力'}
                  </h2>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setShowForm(false); setEditingResponse(undefined); }}
                  >
                    閉じる
                  </button>
                </div>

                <GoogleCalendarButton
                  candidates={event.candidates}
                  onBusySlots={handleBusySlots}
                />

                <RespondForm
                  candidates={event.candidates}
                  busySlots={busySlots}
                  onSubmit={handleResponse}
                  existingResponse={editingResponse}
                />
              </>
            )}
          </div>
        )}
      </div>

      {showFinalize && (
        <FinalizeModal
          candidates={event.candidates}
          responses={event.responses}
          eventTitle={event.title}
          onFinalize={handleFinalize}
          onClose={() => setShowFinalize(false)}
        />
      )}
    </>
  );
}
