export default function Home() {
  return (
    <main className="game-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="Neon Pac 3D home">
          <span className="pac-dot" />
          <span>NEON PAC <b>3D</b></span>
        </a>
        <a className="open-button" href="https://neon-pac-3d.vercel.app" target="_blank" rel="noreferrer">
          OPEN FULL SCREEN <span>↗</span>
        </a>
      </header>

      <section className="game-frame" aria-label="Neon Pac 3D game">
        <iframe
          src="https://neon-pac-3d.vercel.app"
          title="Neon Pac 3D"
          allow="fullscreen"
        />
      </section>

      <footer className="site-footer">
        <span>ARROWS / WASD TO MOVE</span>
        <i />
        <span>SPACE TO FIRE AFTER AN ENERGY CORE</span>
        <i />
        <span>SHARE THE LINK. CHASE THE HIGH SCORE.</span>
      </footer>
    </main>
  );
}
