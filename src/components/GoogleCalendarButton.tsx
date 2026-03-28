import { useState, useCallback } from 'react';
import type { Candidate } from '../types';

interface Props {
  candidates: Candidate[];
  onBusySlots: (slots: Set<string>) => void;
}

const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

export function GoogleCalendarButton({ candidates, onBusySlots }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarName, setCalendarName] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleConnect = useCallback(async () => {
    if (!clientId) {
      alert('Google Client IDが設定されていません。.envにVITE_GOOGLE_CLIENT_IDを設定してください。');
      return;
    }

    setLoading(true);

    try {
      // Use Google Identity Services for token-based auth
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: async (tokenResponse: google.accounts.oauth2.TokenResponse) => {
          if (tokenResponse.error) {
            console.error('OAuth error:', tokenResponse.error);
            setLoading(false);
            return;
          }

          try {
            // Get calendar list to show connected calendar name
            const calListRes = await fetch(
              'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
              { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
            );
            const calList = await calListRes.json();
            if (calList.items?.[0]) {
              setCalendarName(calList.items[0].summary || 'Google Calendar');
            }

            // Check busy times for each candidate date
            const timeMin = candidates.reduce((min, c) => c.date < min ? c.date : min, candidates[0].date);
            const timeMax = candidates.reduce((max, c) => c.date > max ? c.date : max, candidates[0].date);

            const freeBusyRes = await fetch(
              'https://www.googleapis.com/calendar/v3/freeBusy',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  timeMin: `${timeMin}T00:00:00+09:00`,
                  timeMax: `${timeMax}T23:59:59+09:00`,
                  items: [{ id: 'primary' }],
                }),
              }
            );
            const freeBusy = await freeBusyRes.json();
            const busyPeriods = freeBusy.calendars?.primary?.busy || [];

            // Match busy periods with candidates
            const busyIds = new Set<string>();
            candidates.forEach((c) => {
              const candidateStart = c.startTime
                ? new Date(`${c.date}T${c.startTime}:00+09:00`)
                : new Date(`${c.date}T00:00:00+09:00`);
              const candidateEnd = c.endTime
                ? new Date(`${c.date}T${c.endTime}:00+09:00`)
                : new Date(`${c.date}T23:59:59+09:00`);

              for (const busy of busyPeriods) {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                // Check overlap
                if (candidateStart < busyEnd && candidateEnd > busyStart) {
                  busyIds.add(c.id);
                  break;
                }
              }
            });

            onBusySlots(busyIds);
            setConnected(true);
          } catch (err) {
            console.error('Calendar API error:', err);
            alert('カレンダー情報の取得に失敗しました');
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [clientId, candidates, onBusySlots]);

  if (!clientId) return null;

  return (
    <div className="gcal-section">
      {connected ? (
        <div className="gcal-connected">
          <span>✓</span>
          <span>{calendarName}と連携済み（予定がある日は×に設定されています）</span>
        </div>
      ) : (
        <>
          <p>Googleカレンダーと連携して、予定がある日を自動で×にできます</p>
          <button
            type="button"
            className="btn btn-google btn-sm"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? '連携中...' : '📅 Googleカレンダーと連携'}
          </button>
        </>
      )}
    </div>
  );
}
