'use client'
import { ReactNode } from 'react'
import Link from 'next/link'

interface ToolLayoutProps {
  title: string
  description: string
  icon: string
  children: ReactNode
}

export default function ToolLayout({ title, description, icon, children }: ToolLayoutProps) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 32, fontSize: 13, color: 'var(--text-3)' }}>
        <Link href="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 8px' }}>›</span>
        <span style={{ color: 'var(--text-2)' }}>{title}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            marginBottom: 10,
          }}
        >
          {title}
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 560, lineHeight: 1.7 }}>
          {description}
        </p>
        {/* Trust badge */}
        <div
          style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: 99,
            padding: '4px 12px',
            fontSize: 12,
            color: '#5eead4',
            fontFamily: 'var(--font-mono)',
          }}
        >
          🔒 100% private — files never leave your browser
        </div>
      </div>

      {/* Tool content */}
      {children}
    </div>
  )
}
