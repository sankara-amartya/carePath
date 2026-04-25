"use client";

import React, { useState } from 'react';
import { Play, PlayCircle, BookOpen, Users, Activity, Pill, ShieldAlert } from 'lucide-react';

type VideoSection = {
  id: string;
  title: string;
  duration: string;
  icon: React.ElementType;
  description: string;
  steps: string[];
};

const VIDEOS: VideoSection[] = [
  {
    id: "getting-started",
    title: "Getting Started & Adding Medications",
    duration: "2:14",
    icon: Pill,
    description: "Learn how to set up your patient profile and add your first prescriptions to the tracker.",
    steps: [
      "Navigate to the Medications tab from the sidebar.",
      "Tap the floating '+' button to open the medication form.",
      "Enter the drug name, dosage (e.g., 500mg), and select how often it should be taken.",
      "Tap 'Add medication' to save. It will now appear on the daily checklist."
    ]
  },
  {
    id: "daily-checkin",
    title: "The Daily Health Check-in",
    duration: "1:45",
    icon: Activity,
    description: "A walk-through of logging daily vitals like pain, mood, and energy.",
    steps: [
      "Open the 'Health Check-in' tab.",
      "Use the visual sliders to rate Pain, Mood, Appetite, Mobility, and Energy on a scale of 1-5.",
      "Add any specific notes or record a voice memo if there's something unusual.",
      "Submit the check-in. This data instantly appears in the Journal for the whole team to see."
    ]
  },
  {
    id: "care-team",
    title: "Inviting Your Care Team",
    duration: "3:05",
    icon: Users,
    description: "How to bring nurses, doctors, and family members onto the platform.",
    steps: [
      "Go to the 'Care Team' page.",
      "Click the 'Invite' button in the top right corner.",
      "Enter the email address of the person you want to invite.",
      "Select their Role (e.g., Secondary Caregiver for a hired nurse, Doctor for a physician).",
      "They will receive an email to join the exact same dashboard."
    ]
  },
  {
    id: "ai-summaries",
    title: "Generating Doctor Summaries",
    duration: "1:20",
    icon: ShieldAlert,
    description: "Turn a messy week of data into a clean, 1-paragraph summary for the doctor.",
    steps: [
      "Before a doctor's appointment, open the 'AI Summary' page.",
      "Click the 'Generate' button.",
      "The AI will securely read the last 7 days of logs, notes, and vitals.",
      "Click 'Share with doctor' to instantly email the brief to the medical provider."
    ]
  }
];

export default function ManualPage() {
  const [activeVideo, setActiveVideo] = useState<VideoSection>(VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (video: VideoSection) => {
    setActiveVideo(video);
    setIsPlaying(true);
    // In a real app, this would trigger an actual <video> element or iframe
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000); // Mock playing state
  };

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '6rem', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(93,202,165,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint)' }}>
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="sec-title" style={{ margin: 0 }}>Training & User Manual</h1>
          <p style={{ color: 'var(--muted)', margin: '4px 0 0 0', fontSize: '14px' }}>Learn how to manage care effortlessly with CarePath.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Video Player & Instructions */}
        <div style={{ gridColumn: '1 / span 2' }}>
          
          {/* Main Video Player Placeholder */}
          <div style={{ 
            width: '100%', 
            aspectRatio: '16/9', 
            backgroundColor: 'var(--ink2)', 
            borderRadius: 'var(--radius)', 
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, rgba(201,148,58,0.05), rgba(93,202,165,0.05))' }} />
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? 'rgba(93,202,165,0.2)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                zIndex: 10,
                color: isPlaying ? 'var(--mint)' : 'white'
              }}
              onMouseEnter={(e) => {
                if(!isPlaying) e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isPlaying ? <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }} />}
            </button>

            {/* Video Overlays */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
              <div>
                <span className="badge badge-mint" style={{ marginBottom: '8px' }}>Tutorial</span>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{activeVideo.title}</h2>
              </div>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{activeVideo.duration}</span>
            </div>

            {isPlaying && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                 <p style={{ color: 'var(--mint)', fontWeight: 500, letterSpacing: '1px' }}>SIMULATING VIDEO PLAYBACK...</p>
              </div>
            )}
          </div>

          {/* Active Instructions */}
          <div className="card-feat" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--gold)" />
              Step-by-Step Guide
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {activeVideo.description}
            </p>
            
            <ol style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-on-dark)' }}>
              {activeVideo.steps.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.5' }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right Column: Playlist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>Video Library</h3>
          
          {VIDEOS.map((video) => {
            const isActive = activeVideo.id === video.id;
            const Icon = video.icon;
            
            return (
              <div 
                key={video.id}
                onClick={() => handlePlay(video)}
                style={{
                  backgroundColor: isActive ? 'rgba(93,202,165,0.08)' : 'var(--ink2)',
                  border: `1px solid ${isActive ? 'rgba(93,202,165,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isActive ? 'translateX(-4px)' : 'none'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px', 
                  backgroundColor: isActive ? 'var(--mint)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? 'var(--ink)' : 'var(--muted)',
                  flexShrink: 0
                }}>
                  <Icon size={20} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--mint)' : 'var(--text-on-dark)' }}>
                    {video.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlayCircle size={12} color="var(--muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{video.duration}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ 
            marginTop: 'auto', 
            padding: '1.5rem', 
            backgroundColor: 'rgba(201,148,58,0.05)', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid rgba(201,148,58,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--gold)' }}>Need Human Help?</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>
              If you're stuck, our support team is available 24/7 to help you set up your care dashboard.
            </p>
            <button className="b4" style={{ alignSelf: 'flex-start', padding: '8px 16px' }}>
              Contact Support
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
