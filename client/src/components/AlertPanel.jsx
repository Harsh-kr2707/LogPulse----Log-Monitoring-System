export default function AlertPanel({ alerts, onDismiss }) {
  if (alerts.length === 0) return null

  return (
    <div style={{ padding: '10px 16px 0' }}>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <span style={{
          fontSize: '10px',
          color: '#f97316',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}>
          {alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}
        </span>
        <button
          onClick={() => onDismiss('all')}
          style={{
            fontSize: '10px',
            color: '#bbb',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
          }}
        >
          dismiss all
        </button>
      </div>

      {/* Scrollable alert list */}
      <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
        {alerts.map((alert, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#fff7ed',
              border: '0.5px solid #fed7aa',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '6px',
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#f97316',
              flexShrink: 0,
            }} />

            <div style={{ fontSize: '12px', color: '#9a3412', flex: 1 }}>
              <span style={{ fontWeight: 500 }}>{alert.service}</span>
              {' — '}{alert.message}
            </div>

            <div style={{ fontSize: '10px', color: '#fdba74', whiteSpace: 'nowrap' }}>
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => onDismiss(index)}
              style={{
                fontSize: '14px',
                color: '#fdba74',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0 0 0 6px',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}