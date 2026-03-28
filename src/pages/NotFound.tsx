import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function NotFound() {
  return (
    <>
      <Header />
      <div className="container" style={{ textAlign: 'center', paddingTop: '64px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>404</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>ページが見つかりません</p>
        <Link to="/" className="btn btn-primary">トップに戻る</Link>
      </div>
    </>
  );
}
