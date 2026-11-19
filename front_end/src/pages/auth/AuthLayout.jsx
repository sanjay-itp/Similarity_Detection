import Icon from '../../components/Icon';

export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="brand brand-light">
          <span className="brand-mark">
            <Icon name="shield" size={18} />
          </span>
          <span className="brand-name">IntegrityCheck</span>
        </div>
        <div className="auth-pitch">
          <h1>Original work, verified fairly.</h1>
        </div>
        <p className="auth-foot">Similarity Detection System</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
