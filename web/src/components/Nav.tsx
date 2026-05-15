"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pill, Book, Users, Activity, BookOpen } from 'lucide-react';

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/medications', label: 'Meds', icon: Pill },
    { href: '/journal', label: 'Journal', icon: Book },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/manual', label: 'Help', icon: BookOpen },
  ];

  return (
    <nav className="mobile-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--ink2)',
      borderTop: '0.5px solid rgba(255,255,255,0.06)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0 20px',
      zIndex: 50,
    }}>
      {links.map(l => {
        const Icon = l.icon;
        const isActive = pathname === l.href;
        
        return (
          <Link href={l.href} key={l.href} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--mint)' : 'var(--muted)',
            gap: '4px'
          }}>
            <Icon size={24} />
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontWeight: 500
            }}>
              {l.label}
            </span>
          </Link>
        )
      })}
    </nav>
  );
}
