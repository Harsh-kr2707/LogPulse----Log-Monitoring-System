import { useEffect, useState } from 'react'
import LogTable from './components/LogTable'
import AlertPanel from './components/AlertPanel'

export default function App() {
  const [logs, setLogs] = useState([])
  const [alerts, setAlerts] = useState([])
  const [wsStatus, setWsStatus] = useState('connecting')

  const handleDismiss = (index) => {
    if (index === 'all') {
      setAlerts([])
    } else {
      setAlerts(prev => prev.filter((_, i) => i !== index))
    }
  }

  useEffect(() => {
    fetch('http://localhost:4000/api/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error('Failed to fetch logs:', err))
  }, [])

  useEffect(() => {
    let socket
    let reconnectTimer

    function connect() {
      socket = new WebSocket('ws://localhost:4000')

      socket.onopen = () => setWsStatus('connected')

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'alert') setAlerts(prev => [data, ...prev])
        if (data.type === 'log') setLogs(prev => [data, ...prev].slice(0, 200))
      }

      socket.onclose = () => {
        setWsStatus('disconnected')
        reconnectTimer = setTimeout(connect, 3000)
      }

      socket.onerror = () => {
        setWsStatus('error')
        socket.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      socket.close()
    }
  }, [])

  const wsPillStyle = {
    connected:    { background: '#fef9c3', border: '0.5px solid #fde68a', color: '#854d0e' },
    disconnected: { background: '#fee2e2', border: '0.5px solid #fecaca', color: '#991b1b' },
    connecting:   { background: '#f5f5f5', border: '0.5px solid #e5e5e5', color: '#888' },
    error:        { background: '#fee2e2', border: '0.5px solid #fecaca', color: '#991b1b' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', padding: '32px 24px', fontFamily: 'sans-serif' }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '12px',
        border: '0.5px solid #e8e8e8',
        overflow: 'hidden',
      }}>

        {/* Topbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '0.5px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#fef08a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}>⚡</div>
            <span style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>LogPulse</span>
            <span style={{ fontSize: '12px', color: '#bbb' }}>/ log monitor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', color: '#888',
              background: '#f9f9f9', border: '0.5px solid #e8e8e8',
              borderRadius: '20px', padding: '4px 10px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
              live stream
            </div>
            <div style={{
              fontSize: '11px',
              borderRadius: '20px',
              padding: '4px 10px',
              ...wsPillStyle[wsStatus],
            }}>
              ws {wsStatus}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '0.5px solid #f0f0f0' }}>
          {[
            { label: 'total logs',   value: logs.length,                              color: '#111' },
            { label: 'alerts fired', value: alerts.length,                            color: '#ca8a04' },
            { label: 'errors',       value: logs.filter(l => l.level === 'ERROR').length, color: '#ef4444' },
            { label: 'warnings',     value: logs.filter(l => l.level === 'WARN').length,  color: '#d97706' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '14px 24px',
              borderRight: i < 3 ? '0.5px solid #f0f0f0' : 'none',
            }}>
              <div style={{ fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 500, color: stat.color }}>
                {stat.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Alert panel */}
        <AlertPanel alerts={alerts} onDismiss={handleDismiss} />

        {/* Section label */}
        <div style={{
          fontSize: '10px', color: '#ccc',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '12px 24px 6px',
        }}>
          recent logs
        </div>

        {/* Log table */}
        <LogTable logs={logs} />

        {/* Footer */}
        <div style={{
          padding: '10px 24px',
          borderTop: '0.5px solid #f5f5f5',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            display: 'inline-block',
            background: '#fef08a',
            color: '#713f12',
            fontSize: '10px',
            fontWeight: 500,
            borderRadius: '4px',
            padding: '1px 6px',
          }}>
            LogPulse
          </span>
          <span style={{ fontSize: '11px', color: '#ccc' }}>
            distributed log monitoring and alerting system
          </span>
        </div>

      </div>
    </div>
  )
}