import Icon from '/components/Icon';

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
          <h1>Similarity detection for your campus network.</h1>
          <p>
            Students submit assignments. Teachers compare every submission against the others and review highlighted
            overlap side by side. Everything stays on your local server.
          </p>
          <ul className="auth-points">
            <li>
              <Icon name="upload" /> Simple assignment submission
            </li>
            <li>
              <Icon name="scan" /> Pairwise similarity checks
            </li>
            <li>
              <Icon name="shield" /> Hosted locally, files never leave the institution
            </li>
          </ul>
        </div>
        <p className="auth-foot">Similarity Detection System</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
