import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState(null);

  async function loadProfile() {
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/me', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const body = await response.json();
      setCheckedAt(new Date());
      if (!response.ok) {
        setProfile(null);
        setState('unavailable');
        setError(body.detail || 'Could not read the current user.');
        return;
      }
      setProfile(body);
      setState('authenticated');
    } catch (err) {
      setProfile(null);
      setState('error');
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setCheckedAt(new Date());
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const displayName = profile?.username || profile?.email || profile?.user_id;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Databricks SSO Lab home">
          <span className="brand-mark">D</span>
          <span>Identity Lab <span className="brand-divider">/</span> Databricks Apps</span>
        </a>
        <span className="environment"><span className="status-dot" /> SSO learning project</span>
      </header>

      <main className="content">
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR FIRST AUTH FEATURE</div>
          <h1>One app.<br /><span>Platform-managed sign-in.</span></h1>
          <p className="hero-copy">
            See how Databricks authenticates access to the app, then passes the
            signed-in user's identity to your FastAPI backend.
          </p>
        </section>

        <section className={`identity-card ${state}`} aria-live="polite">
          <div className="card-heading">
            <div className="card-icon" aria-hidden="true">
              {state === 'authenticated' ? '✓' : state === 'loading' ? '…' : 'i'}
            </div>
            <div className="card-heading-copy">
              <div className="card-overline">CURRENT SESSION</div>
              <h2>{state === 'authenticated' ? 'Identity detected' : state === 'loading' ? 'Checking identity…' : 'Identity not available'}</h2>
            </div>
            <span className={`state-pill ${state}`}>
              {state === 'authenticated' ? 'AUTHENTICATED' : state === 'loading' ? 'CHECKING' : state === 'error' ? 'ERROR' : 'NOT DETECTED'}
            </span>
          </div>

          {state === 'authenticated' && profile ? (
            <>
              <div className="profile-block">
                <div className="avatar">{(displayName || 'U').slice(0, 1).toUpperCase()}</div>
                <div className="profile-details">
                  <strong>{displayName}</strong>
                  <span>{profile.email || 'No email header was provided'}</span>
                </div>
              </div>
              <div className="claims-grid">
                <Claim label="Forwarded user ID" value={profile.user_id} />
                <Claim label="Preferred username" value={profile.username || 'Not provided'} />
                <Claim label="Identity source" value="Databricks Apps gateway" />
              </div>
            </>
          ) : state === 'loading' ? (
            <div className="message-box"><span className="spinner" /> Requesting <code>GET /api/me</code> from FastAPI…</div>
          ) : (
            <>
              <div className="message-box warning-box">
                <strong>FastAPI could not detect a forwarded user identity.</strong>
                <span>{error || 'The request did not return an identity.'}</span>
              </div>
              <div className="help-text">
                This is expected when running locally. Databricks supplies these headers when the request passes through the Databricks Apps gateway.
              </div>
            </>
          )}

          <div className="card-footer">
            <span>{checkedAt ? `Checked at ${checkedAt.toLocaleTimeString()}` : 'Waiting for API response'}</span>
            <button className="refresh-button" onClick={loadProfile} disabled={state === 'loading'}>
              <span aria-hidden="true">↻</span> Check again
            </button>
          </div>
        </section>

        <section className="flow-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">WHAT HAPPENS</div>
              <h2>The sign-in journey</h2>
            </div>
            <span className="section-note">Managed by the platform</span>
          </div>
          <div className="flow-list">
            <FlowStep number="01" title="The user opens the Databricks App URL" detail="The gateway checks the user's session and app permissions." />
            <FlowStep number="02" title="Databricks handles sign-in when required" detail="Your React page only loads after the gateway allows access." />
            <FlowStep number="03" title="FastAPI reads forwarded identity headers" detail="GET /api/me returns the identity claims available to the app." />
            <FlowStep number="04" title="Your app applies business permissions" detail="Next step: map this identity to an application user and roles." />
          </div>
        </section>

        <section className="boundary-note">
          <div className="boundary-icon">!</div>
          <div>
            <h3>Important distinction</h3>
            <p>This project does not implement a custom OAuth button or OAuth callback. Databricks manages the app-entry sign-in. The endpoint only reads the identity headers forwarded inside the Databricks Apps runtime.</p>
          </div>
        </section>

        <footer className="footer">
          <span>React + Vite · FastAPI · Databricks Apps</span>
          <a href="/docs" target="_blank" rel="noreferrer">Open FastAPI docs ↗</a>
        </footer>
      </main>
    </div>
  );
}

function Claim({ label, value }) {
  return <div className="claim"><span>{label}</span><strong title={value}>{value}</strong></div>;
}

function FlowStep({ number, title, detail }) {
  return (
    <div className="flow-step">
      <div className="step-number">{number}</div>
      <div className="step-copy"><h3>{title}</h3><p>{detail}</p></div>
      <div className="step-check" aria-hidden="true">↗</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
