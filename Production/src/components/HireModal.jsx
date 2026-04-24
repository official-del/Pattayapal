import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { FiAlertCircle, FiMapPin, FiX, FiSearch, FiCheck, FiZap } from 'react-icons/fi';
import { CoinIcon, CoinBadge } from './CoinIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';

function HireModal({ freelancerId, freelancerName, onClose, currentToken, initialData = null }) {
  const { user, fetchProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    budget: initialData?.budget || 0,
    location: initialData?.location || { lat: 13.7563, lng: 100.5018, address: '' }
  });
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  useEffect(() => {
    if (fetchProfile) fetchProfile();
  }, []);

  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapInstanceRef.current) {
      const L = window.L;
      if (!L) return;

      const initialLat = formData.location.lat || 13.7563;
      const initialLng = formData.location.lng || 100.5018;

      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([initialLat, initialLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      
      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      const onLocationChange = (lat, lng) => {
        reverseGeocode(lat, lng);
      };

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [showMap]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`);
      const data = await resp.json();
      if (data && data.display_name) {
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, address: data.display_name, lat, lng }
        }));
      }
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=th&limit=1`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const nLat = parseFloat(lat);
        const nLon = parseFloat(lon);
        
        if (mapInstanceRef.current && markerInstanceRef.current) {
           mapInstanceRef.current.setView([nLat, nLon], 15);
           markerInstanceRef.current.setLatLng([nLat, nLon]);
           setFormData(prev => ({
             ...prev,
             location: { ...prev.location, address: display_name, lat: nLat, lng: nLon }
           }));
        }
      } else {
        alert("ไม่พบสถานที่ที่ระบุ");
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const userInfo = user || JSON.parse(localStorage.getItem('userInfo'));
  const coinBalance = user?.coinBalance || userInfo?.coinBalance || 0;

  const isInsufficient = formData.budget > coinBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛡️ Client-side safety check
    if (userInfo?._id === freelancerId || userInfo?.id === freelancerId) {
      return alert("คุณไม่สามารถจ้างงานตนเองได้ครับ");
    }

    setLoading(true);
    try {
      await jobsAPI.create({
        freelancerId,
        ...formData
      }, currentToken);
      alert(`ส่งคำขอจ้างงานให้คุณ ${freelancerName} สำเร็จ!`);
      if (fetchProfile) fetchProfile();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'จ้างงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#0a0a0a', border: '1px solid #333', borderRadius: '20px',
        padding: '30px', width: '100%', maxWidth: '500px', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>จ้างงาน {freelancerName}</h2>
        <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '24px' }}>กรอกรายละเอียดงานที่คุณต้องการจ้างเพื่อให้ฟรีแลนซ์พิจารณา</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>ชื่องาน / โปรเจกต์</label>
            <input 
              type="text" 
              required
              placeholder="เช่น งานถ่ายรูปงานแต่งงาน"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>งบประมาณ (GOLD COINS)</label>
            <input 
              type="number" 
              required
              placeholder="0.00"
              value={formData.budget === 0 ? '' : formData.budget}
              onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
              style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>รายละเอียดงาน / วันเวลา</label>
            <textarea 
              required
              rows={4}
              placeholder="ระบุสิ่งที่ต้องการจ้าง วันเวลา และสถานที่..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none', resize: 'none' }}
            />
          </div>

          <div>
             <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', marginBottom: '8px', letterSpacing: '1px' }}>สถานที่ / ที่อยู่ทำงาน (เลือกจากแผนที่)</label>
             <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="คลิกปุ่มขวาเพื่อจิ้มในแผนที่..."
                  value={formData.location.address}
                  readOnly
                  style={{ flex: 1, background: '#111', border: '1px solid #222', padding: '12px 16px', borderRadius: '10px', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowMap(true)}
                  style={{ background: 'var(--accent)', border: 'none', padding: '0 15px', borderRadius: '10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FiMapPin />
                </button>
             </div>
          </div>

          <div style={{ 
            background: 'rgba(255, 87, 51, 0.05)', 
            border: '1px solid rgba(255, 87, 51, 0.2)', 
            padding: '15px', 
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: '#ff8c33',
            display: 'flex',
            gap: '10px'
          }}>
            <FiAlertCircle style={{ fontSize: '2rem' }} />
            <div>
              <strong>หมายเหตุระบบ Escrow:</strong> เมื่อคุณกดส่งคำขอจ้างงาน ระบบจะ "พักเงิน" (Escrow) ตามงบประมาณที่คุณระบุไว้จากกระเป๋าเงินของคุณทันที เพื่อเป็นการการันตีโปรเจกต์
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Coin ของคุณ: <CoinBadge amount={coinBalance} size="sm" />
            </div>
            {isInsufficient && (
              <Link to="/dashboard/wallet" style={{ color: '#ff5733', fontSize: '0.85rem', fontWeight: 'bold' }}>เติม Coin เพิ่มที่นี่</Link>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || isInsufficient}
            style={{
              background: isInsufficient ? '#333' : 'linear-gradient(45deg, #ff5733, #ff8c33)',
              color: isInsufficient ? '#666' : '#fff', border: 'none', padding: '14px', borderRadius: '12px',
              fontWeight: '700', fontSize: '1rem', cursor: isInsufficient ? 'not-allowed' : 'pointer', marginTop: '5px',
              opacity: loading ? 0.6 : 1, transition: '0.3s'
            }}
          >
            {loading ? 'กำลังส่งคำขอ...' : (isInsufficient ? 'ยอด Coin ไม่เพียงพอ' : 'ยืนยันจ้างงานและวางเงิน')}
          </button>
        </form>
      </div>

       {/* 🗺️ MAP PICKER OVERLAY */}
       <AnimatePresence>
         {showMap && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
           >
             <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '25px', width: '100%', maxWidth: '600px', padding: '25px', position: 'relative' }}>
                <button onClick={() => setShowMap(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><FiX size={24}/></button>
                <h3 style={{ color: '#fff', margin: '0 0 15px 0' }}>📍 เลือกสถานที่บนแผนที่</h3>

                <div className="location-search-box" style={{ width: '100%', marginBottom: '15px', position: 'relative' }}>
                   <input 
                     type="text" 
                     placeholder="ค้นชื่อสถานที่..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSearchPlace()}
                     style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 50px 12px 15px', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
                   />
                   <button 
                     onClick={handleSearchPlace} 
                     disabled={isSearching}
                     style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'var(--accent)', border: 'none', padding: '8px 12px', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
                   >
                     {isSearching ? <FiZap className="spin" /> : <FiSearch />}
                   </button>
                </div>
                
                <div ref={mapContainerRef} style={{ width: '100%', height: '350px', borderRadius: '15px', background: '#111', border: '1px solid #222' }} />
                
                <div style={{ marginTop: '20px' }}>
                   <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>ที่อยู่ที่เลือก:</p>
                   <div style={{ background: '#111', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#fff', border: '1px solid #222', minHeight: '40px' }}>
                      {formData.location.address || 'จิ้มเลือกบนแผนที่...'}
                   </div>
                </div>

                <button 
                  onClick={() => setShowMap(false)}
                  style={{ width: '100%', marginTop: '20px', background: 'var(--accent)', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  ตกลงและเลือกตำแหน่งนี้
                </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <style>{`
          .leaflet-tile { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
       `}</style>
      </div>
  );
}

export default HireModal;
