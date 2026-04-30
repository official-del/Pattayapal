import { toast } from 'react-hot-toast';

export const customConfirm = (message) => {
  return new Promise((resolve) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>⚠️</span>
          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{message}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => { toast.dismiss(t.id); resolve(false); }} 
            style={{ background: '#222', color: '#fff', border: '1px solid #333', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            ยกเลิก
          </button>
          <button 
            onClick={() => { toast.dismiss(t.id); resolve(true); }} 
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity, 
      style: { background: '#0a0a0a', border: '1px solid rgba(239,68,68,0.3)', color: '#fff', minWidth: '300px' },
      position: 'top-center'
    });
  });
};
