import { toast } from 'react-hot-toast';

export const customConfirm = (message) => {
  return new Promise((resolve) => {
    toast((t) => (
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '260px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>⚠️</span>
          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff', lineHeight: 1.4 }}>{message}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              toast.dismiss(t.id); 
              resolve(false); 
            }} 
            style={{ 
              background: '#222', 
              color: '#bbb', 
              border: '1px solid #444', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            ยกเลิก
          </button>
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              toast.dismiss(t.id); 
              resolve(true); 
            }} 
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
              color: '#fff', 
              border: 'none', 
              padding: '8px 18px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '700', 
              fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(239,68,68,0.35)' 
            }}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    ), { 
      duration: 10000, 
      style: { 
        background: '#0d0d11', 
        border: '1px solid rgba(239,68,68,0.35)', 
        color: '#fff', 
        minWidth: '280px',
        maxWidth: '92vw',
        borderRadius: '14px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.85)'
      },
      position: 'top-center'
    });
  });
};
