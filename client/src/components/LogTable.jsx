const levelStyles = {
  INFO:  { color: '#16a34a' },
  WARN:  { color: '#d97706' },
  ERROR: { color: '#dc2626' },
}

export default function LogTable({ logs }) {
  if (logs.length === 0) {
    return (
      <div style={{ padding: '24px', fontSize: '12px', color: '#ccc' }}>
        No logs yet. Make sure producer and consumer are running.
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: '520px' }}>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 140px 70px 1fr',
        padding: '6px 24px',
        borderBottom: '0.5px solid #f5f5f5',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 1,
      }}>
        {['time', 'service', 'level', 'message'].map(col => (
          <div key={col} style={{
            fontSize: '10px',
            color: '#ccc',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Log rows */}
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 140px 70px 1fr',
            padding: '9px 24px',
            borderBottom: '0.5px solid #fafafa',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fefce8'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ fontSize: '12px', color: '#bbb' }}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </div>
          <div style={{ fontSize: '12px', color: '#444', fontWeight: 500 }}>
            {log.service}
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.03em',
            ...(levelStyles[log.level] || { color: '#999' })
          }}>
            {log.level}
          </div>
          <div style={{ fontSize: '14px', color: '#555' }}>
            {log.message}
          </div>
        </div>
      ))}
    </div>
  )
}