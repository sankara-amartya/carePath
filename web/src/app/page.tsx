"use client";

import React from "react";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="root">
      <div className="hero">
        <div className="hero-tag">
          <div className="hero-dot"></div>Design system v1.0
        </div>
        <h1 className="hero-title">
          CarePath<br />
          <em>Dashboard</em>
        </h1>
        <p className="hero-sub">
          Visual language, component library, and UX principles for the CarePath elder care platform — inspired by warmth, trust, and calm clarity.
        </p>
        <div className="hero-btns">
          <Link href="/checkin" className="btn-primary" style={{ textDecoration: 'none' }}>Daily Check-in</Link>
          <Link href="/medications" className="btn-ghost" style={{ textDecoration: 'none' }}>View Patient Logs</Link>
        </div>
      </div>

      <div className="sec">
        <div className="sec-label">Overview</div>
        <div className="sec-title">Health Check-in · Today</div>
        <p className="sec-sub">Dad's pain score has been trending up over the last 5 days. Consider mentioning this at Thursday's appointment.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          <div className="card-stat">
            <div className="stat-val">94%</div>
            <div className="stat-lbl">Adherence this week</div>
          </div>
          <div className="card-stat" style={{ background: 'rgba(201,148,58,.07)', borderColor: 'rgba(201,148,58,.15)' }}>
            <div className="stat-val" style={{ color: 'var(--gold)' }}>3.8</div>
            <div className="stat-lbl">Avg pain score</div>
          </div>
          <div className="card-stat">
            <div className="stat-val">12d</div>
            <div className="stat-lbl">Streak ✓</div>
          </div>
        </div>

        <div className="badge-row" style={{ marginBottom:('20px') }}>
          <span className="badge badge-mint">Taken</span>
          <span className="badge badge-gold">Due soon</span>
          <span className="badge badge-red">Missed</span>
          <span className="badge badge-gray">Scheduled</span>
        </div>

        <div className="comp-grid">
          <div className="card-feat">
            <div className="card-feat-icon" style={{ background: 'rgba(93,202,165,.12)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#5DCAA5" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="#5DCAA5" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <div className="card-feat-title">Pill verified</div>
            <div className="card-feat-desc">Lisinopril 10mg · Confirmed correct by AI vision · 8:03 AM</div>
          </div>
          <div className="card-feat">
            <div className="card-feat-icon" style={{ background: 'rgba(201,148,58,.12)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v5l3 3" stroke="#C9943A" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="#C9943A" strokeWidth="1.2"/></svg>
            </div>
            <div className="card-feat-title">Dose due</div>
            <div className="card-feat-desc">Metformin 500mg · Due in 20 minutes · Reminder sent</div>
          </div>
          <div className="card-feat" style={{ borderColor: 'rgba(93,202,165,.2)' }}>
            <div className="card-feat-icon" style={{ background: 'rgba(93,202,165,.1)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13s1-4 5-4 5 4 5 4" stroke="#5DCAA5" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="6" r="2.5" stroke="#5DCAA5" strokeWidth="1.2"/></svg>
            </div>
            <div className="card-feat-title">Weekly summary</div>
            <div className="card-feat-desc">AI-generated · Last 7 days · Ready to share with doctor</div>
          </div>
          <div className="card-feat">
            <div className="card-feat-icon" style={{ background: 'rgba(220,80,80,.1)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v6M8 11v1.5" stroke="#E07070" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="#E07070" strokeWidth="1.2"/></svg>
            </div>
            <div className="card-feat-title">Anomaly alert</div>
            <div className="card-feat-desc">Appetite down 3 days in a row · Check in with Dad</div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div className="sec-title">Search Logs..</div>
          <input className="inp" placeholder="Search medications, logs, team members..." readOnly />
        </div>
      </div>
      
      <div className="cta-strip">
        <h3>Need to notify the Doctor?</h3>
        <p>Send an AI generated weekly summary directly to the provider portal.</p>
        <div className="cta-btns">
            <Link href="/summary" className="btn-primary" style={{ textDecoration: 'none' }}>Generate Report ↗</Link>
        </div>
      </div>
    </div>
  );
}
