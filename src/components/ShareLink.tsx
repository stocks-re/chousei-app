import { useState } from 'react';

interface Props {
  eventId: string;
}

export function ShareLink({ eventId }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/event/${eventId}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-box">
      <input type="text" value={url} readOnly />
      <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
        {copied ? 'コピー済み!' : 'コピー'}
      </button>
    </div>
  );
}
