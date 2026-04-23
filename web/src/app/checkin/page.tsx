"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Slider from '@radix-ui/react-slider';
import { Mic, X } from 'lucide-react';

export default function CheckInPage() {
  const router = useRouter();
  const [pain, setPain] = useState([3]);
  const [mood, setMood] = useState([3]);
  const [appetite, setAppetite] = useState([3]);
  const [mobility, setMobility] = useState([3]);
  const [energy, setEnergy] = useState([3]);
  const [isRecording, setIsRecording] = useState(false);

  const renderSlider = (label: string, value: number[], setValue: (val: number[]) => void) => {
    const isLow = value[0] < 3;
    const accentColor = isLow ? 'var(--gold)' : 'var(--mint)';

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: accentColor }}>{value[0]} / 5</span>
        </div>
        <Slider.Root
          value={value}
          onValueChange={setValue}
          max={5}
          min={1}
          step={1}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', userSelect: 'none', touchAction: 'none', height: '20px' }}
        >
          <Slider.Track style={{ backgroundColor: 'rgba(255,255,255,0.1)', position: 'relative', flexGrow: 1, borderRadius: '9999px', height: '4px' }}>
            <Slider.Range style={{ position: 'absolute', backgroundColor: accentColor, borderRadius: '9999px', height: '100%' }} />
          </Slider.Track>
          <Slider.Thumb style={{ display: 'block', width: '20px', height: '20px', backgroundColor: accentColor, boxShadow: '0 0 0 2px var(--ink)', borderRadius: '50%' }} aria-label={label} />
        </Slider.Root>
      </div>
    );
  };

  return (
    <div style={{ padding: '0', minHeight: '100vh', backgroundColor: 'var(--ink)' }}>
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '24px', margin: 0 }}>How is Dad today?</h1>
        <button onClick={() => router.back()} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '0 1.5rem 6rem' }}>
        {renderSlider('Pain', pain, setPain)}
        {renderSlider('Mood', mood, setMood)}
        {renderSlider('Appetite', appetite, setAppetite)}
        {renderSlider('Mobility', mobility, setMobility)}
        {renderSlider('Energy', energy, setEnergy)}

        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 1.5rem 0' }}>Add a voice note (optional)</p>
          <button 
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            onMouseLeave={() => setIsRecording(false)}
            onTouchStart={() => setIsRecording(true)}
            onTouchEnd={() => setIsRecording(false)}
            style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              backgroundColor: isRecording ? 'rgba(220,80,80,0.2)' : 'var(--sage-light)', 
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {isRecording ? <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--alert)', animation: 'pulse 1.5s infinite' }} /> : <Mic color="var(--ink)" size={24} />}
          </button>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            {isRecording ? 'Recording... release to stop' : 'Hold to record'}
          </p>
        </div>

        <button onClick={() => router.back()} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '2rem', padding: '16px' }}>
          Submit check-in
        </button>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
