export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-icon">⎔</span>
          <div>
            <h1 className="header-title">LP·Ops</h1>
            <p className="header-sub">Linear Programming Optimizer</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="header-dot" />
          API Ready
        </div>
      </div>
    </header>
  );
}
