import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-logo">
          <div className="app-logo-icon">調</div>
          日程調整くん
        </Link>
      </div>
    </header>
  );
}
