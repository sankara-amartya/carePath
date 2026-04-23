"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pill, Book, Users, FileText, Bell, Activity, BookOpen, Menu } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/medications', label: 'Medications', icon: Pill },
    { href: '/checkin', label: 'Health Check-in', icon: Activity },
    { href: '/summary', label: 'AI Summary', icon: FileText },
    { href: '/journal', label: 'Journal', icon: Book },
    { href: '/team', label: 'Care Team', icon: Users },
    { href: '/manual', label: 'User Manual', icon: BookOpen },
  ];

  return (
    <div style={{
      width: isCollapsed ? '80px' : '260px',
      backgroundColor: 'var(--ink2)',
      borderRight: '0.5px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: isCollapsed ? '24px 8px' : '24px 16px',
      position: 'sticky',
      top: 0,
      transition: 'width 0.3s ease, padding 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: isCollapsed ? 'center' : 'space-between', 
        marginBottom: '40px', 
        padding: '0 8px',
        flexDirection: isCollapsed ? 'column' : 'row',
        gap: isCollapsed ? '16px' : '0'
      }}>
        {!isCollapsed && <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '24px', color: 'var(--text-on-dark)', margin: 0, whiteSpace: 'nowrap' }}>CarePath</h2>}
        <div style={{ display: 'flex', gap: '8px', flexDirection: isCollapsed ? 'column' : 'row', alignItems: 'center' }}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              width: '36px', height: '36px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>
          <button style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '50%', 
            width: '36px', height: '36px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--mint)', cursor: 'pointer', position: 'relative',
            flexShrink: 0
          }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: '0px', right: '0px', width: '8px', height: '8px', backgroundColor: 'var(--alert)', borderRadius: '50%' }}></span>
          </button>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {links.map(l => {
          const Icon = l.icon;
          const isActive = pathname === l.href;
          
          return (
            <Link href={l.href} key={l.href} title={isCollapsed ? l.label : undefined} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              textDecoration: 'none',
              color: isActive ? 'var(--ink)' : 'var(--muted)',
              backgroundColor: isActive ? 'var(--mint)' : 'transparent',
              padding: isCollapsed ? '12px' : '12px 16px',
              borderRadius: 'var(--radius-sm)',
              gap: isCollapsed ? '0' : '12px',
              transition: 'background 0.2s, color 0.2s',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <span style={{
                  fontSize: '14px',
                  fontFamily: 'var(--font-dm-sans), sans-serif',
                  fontWeight: isActive ? 600 : 500
                }}>
                  {l.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ 
        padding: '16px 8px', 
        marginTop: 'auto', 
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <p style={{ 
          fontSize: '12px', 
          color: 'var(--muted)', 
          margin: 0,
          whiteSpace: 'nowrap'
        }}>
          {isCollapsed ? 'v1.0' : 'CarePath v1.0.0'}
        </p>
      </div>
    </div>
  );
}
