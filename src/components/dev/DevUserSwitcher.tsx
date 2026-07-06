'use client'

import { useRouter } from 'next/navigation'
import { DEV_PROFILES } from '@/lib/auth/dev-session'

interface Props {
  currentProfileId: string | null
}

export function DevUserSwitcher({ currentProfileId }: Props) {
  const router = useRouter()

  async function switchUser(profileId: string | null) {
    await fetch('/api/dev/set-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId }),
    })
    router.refresh()
  }

  const current = currentProfileId ? DEV_PROFILES[currentProfileId] : null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#1e293b',
        borderTop: '2px solid #f59e0b',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <span style={{ color: '#f59e0b', fontWeight: 700, marginRight: '4px' }}>
        DEV
      </span>
      <span style={{ color: '#94a3b8' }}>
        {current ? `▸ ${current.label}` : '▸ No session'}
      </span>
      <span style={{ color: '#475569', margin: '0 4px' }}>|</span>

      {Object.entries(DEV_PROFILES).map(([id, profile]) => (
        <button
          key={id}
          onClick={() => switchUser(id)}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'monospace',
            backgroundColor: currentProfileId === id ? '#f59e0b' : '#334155',
            color: currentProfileId === id ? '#1e293b' : '#e2e8f0',
            fontWeight: currentProfileId === id ? 700 : 400,
          }}
        >
          {profile.label}
        </button>
      ))}

      <button
        onClick={() => switchUser(null)}
        style={{
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid #475569',
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: 'monospace',
          backgroundColor: 'transparent',
          color: '#94a3b8',
          marginLeft: '4px',
        }}
      >
        Logout
      </button>
    </div>
  )
}
