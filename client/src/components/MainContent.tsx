
function MainContent() {
  return (
    <div className="app">
      <header className="header">
        <h1>🎫 AI-Powered Helpdesk System</h1>
        <p>Full-stack TypeScript project with Express, React, and Bun</p>
      </header>

      <main className="main">
        <div className="card">
          <h2>Backend Connection</h2>
          <p>Loading...</p>
        </div>
        <div className="card">
          <h2>Tech Stack</h2>
          <ul className="tech-list">
            <li><strong>Backend:</strong> Node.js + Express + TypeScript</li>
            <li><strong>Frontend:</strong> React + TypeScript + Vite</li>
            <li><strong>Runtime:</strong> Bun</li>
            <li><strong>Database:</strong> PostgreSQL (to be configured)</li>
            <li><strong>AI:</strong> Claude API (to be configured)</li>
          </ul>
        </div>
        <div className="card">
          <h2>Next Steps</h2>
          <ol className="steps">
            <li>Install and configure PostgreSQL</li>
            <li>Set up Prisma ORM</li>
            <li>Implement authentication system</li>
            <li>Build ticket management features</li>
            <li>Integrate Claude API for AI features</li>
          </ol>
        </div>
      </main>
      <footer className="footer">
        <p>Project initialized on August 12, 2026</p>
      </footer>
    </div>
  );
}

export default MainContent;
