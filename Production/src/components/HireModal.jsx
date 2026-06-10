import { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiMapPin, FiSearch, FiX, FiZap } from 'react-icons/fi';
import { jobsAPI, walletAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { CoinBadge } from './CoinIcon';
import GasIcon from './GasIcon';
import '../css/HireModal.css';

const GAS_COSTS = {
  Bronze: 10,
  Silver: 20,
  Gold: 30,
  Platinum: 40,
  Diamond: 50,
  Conqueror: 60,
};

function getStoredUser() {
  try {
    return JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
}

function HireModal({ freelancerId, freelancerName, freelancerRank, onClose, currentToken, initialData = null }) {
  const { user, fetchProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    budget: initialData?.budget || 0,
    location: initialData?.location || { lat: 13.7563, lng: 100.5018, address: '' },
  });
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const userInfo = user || getStoredUser();
  const coinBalance = user?.coinBalance || userInfo?.coinBalance || 0;
  const currentGas = user?.gas !== undefined ? user.gas : (userInfo?.gas || 0);
  const rankName = freelancerRank || 'Bronze';
  const gasCost = GAS_COSTS[rankName] || 10;
  const isInsufficientCoins = Number(formData.budget) > coinBalance;
  const isInsufficientGas = currentGas < gasCost;

  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapInstanceRef.current) return undefined;

    const L = window.L;
    if (!L) return undefined;

    const initialLat = formData.location.lat || 13.7563;
    const initialLng = formData.location.lng || 100.5018;
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    const updateLocation = (lat, lng) => reverseGeocode(lat, lng);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updateLocation(pos.lat, pos.lng);
    });

    map.on('click', (event) => {
      marker.setLatLng(event.latlng);
      updateLocation(event.latlng.lat, event.latlng.lng);
    });

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
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`);
      const data = await response.json();
      if (data?.display_name) {
        setFormData((prev) => ({
          ...prev,
          location: { ...prev.location, address: data.display_name, lat, lng },
        }));
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
  };

  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=th&limit=1`);
      const data = await response.json();

      if (!data?.length) {
        toast.error('ไม่พบสถานที่ที่ระบุ');
        return;
      }

      const { lat, lon, display_name } = data[0];
      const nextLat = parseFloat(lat);
      const nextLng = parseFloat(lon);

      if (mapInstanceRef.current && markerInstanceRef.current) {
        mapInstanceRef.current.setView([nextLat, nextLng], 15);
        markerInstanceRef.current.setLatLng([nextLat, nextLng]);
        setFormData((prev) => ({
          ...prev,
          location: { ...prev.location, address: display_name, lat: nextLat, lng: nextLng },
        }));
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('ค้นหาสถานที่ไม่สำเร็จ');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefillGas = async () => {
    if (loading) return;

    const refillCost = 1000;
    if (coinBalance < refillCost) {
      toast.error(`ยอด Coin ไม่พอสำหรับเติม Gas ต้องใช้ ${refillCost} Coins`);
      return;
    }

    setLoading(true);
    try {
      await walletAPI.refillGas({ percent: 100 });
      toast.success('เติม Gas เต็มถังแล้ว');
      if (fetchProfile) fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เติม Gas ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (userInfo?._id === freelancerId || userInfo?.id === freelancerId) {
      toast.error('คุณไม่สามารถจ้างงานตนเองได้ครับ');
      return;
    }

    setLoading(true);
    try {
      await jobsAPI.create({
        freelancerId,
        ...formData,
      }, currentToken);
      toast.success(`ส่งคำขอจ้างงานให้คุณ ${freelancerName} สำเร็จ`);
      if (fetchProfile) fetchProfile();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'จ้างงานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="hire-modal-shell" role="presentation">
      <motion.div
        className="hire-modal-card"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hire-modal-title"
      >
        <button type="button" className="hire-modal-close" onClick={onClose} aria-label="Close hire modal">
          <FiX />
        </button>

        <header className="hire-modal-header">
          <span className="hire-modal-kicker"><FiZap /> Hire Quest</span>
          <h2 id="hire-modal-title">จ้างงาน {freelancerName}</h2>
          <p>กรอกรายละเอียดงาน งบประมาณ และพื้นที่ทำงาน เพื่อส่งคำขอให้ครีเอเตอร์พิจารณา</p>
        </header>

        <form onSubmit={handleSubmit} className="hire-modal-form">
          <div className="hire-field-group">
            <label htmlFor="hire-title">ชื่องาน / โปรเจกต์</label>
            <input
              id="hire-title"
              type="text"
              required
              placeholder="เช่น ถ่ายภาพงานแต่งงาน หรือออกแบบโปสเตอร์"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            />
          </div>

          <div className="hire-field-group">
            <label htmlFor="hire-budget">งบประมาณ (Gold Coins)</label>
            <input
              id="hire-budget"
              type="number"
              required
              min="0"
              placeholder="0.00"
              value={formData.budget === 0 ? '' : formData.budget}
              onChange={(event) => setFormData({ ...formData, budget: Number(event.target.value) })}
            />
          </div>

          <div className="hire-field-group">
            <label htmlFor="hire-description">รายละเอียดงาน / วันเวลา</label>
            <textarea
              id="hire-description"
              required
              rows={4}
              placeholder="ระบุสิ่งที่ต้องการจ้าง วันเวลา สถานที่ และผลลัพธ์ที่คาดหวัง..."
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            />
          </div>

          <div className="hire-field-group">
            <label htmlFor="hire-location">สถานที่ / ที่อยู่ทำงาน</label>
            <div className="hire-location-row">
              <input
                id="hire-location"
                type="text"
                placeholder="เลือกตำแหน่งจากแผนที่..."
                value={formData.location.address}
                readOnly
              />
              <button type="button" className="hire-map-button" onClick={() => setShowMap(true)} aria-label="เลือกตำแหน่งจากแผนที่">
                <FiMapPin />
              </button>
            </div>
          </div>

          <section className="hire-escrow-note">
            <FiAlertCircle />
            <div>
              <strong>Escrow protection</strong>
              <p>เมื่อส่งคำขอจ้างงาน ระบบจะพักเงินตามงบประมาณที่ระบุไว้ในกระเป๋าเงินของคุณทันที เพื่อยืนยันโปรเจกต์กับฟรีแลนซ์</p>
            </div>
          </section>

          <section className="hire-summary-panel">
            <div className="hire-balance-row">
              <span>Coin ของคุณ</span>
              <CoinBadge amount={coinBalance} size="sm" />
              {isInsufficientCoins && (
                <Link to="/dashboard/wallet" className="hire-refill-link">เติม Coin</Link>
              )}
            </div>

            <div className={`hire-energy-row ${isInsufficientGas ? 'is-warning' : ''}`}>
              <GasIcon gas={currentGas} size="42px" />
              <div className="hire-energy-copy">
                <strong>Energy {currentGas}%</strong>
                <small>Hire {freelancerName} ({rankName}) consumes {gasCost}%</small>
              </div>
              {isInsufficientGas && (
                <button type="button" className="hire-refill-button" onClick={handleRefillGas}>
                  เติม Gas
                </button>
              )}
            </div>
          </section>

          <button
            type="submit"
            className="hire-submit-button"
            disabled={loading || isInsufficientCoins || isInsufficientGas}
          >
            {loading ? (
              <span className="hire-loading-label"><FiZap className="hire-spin" /> กำลังส่งคำขอ...</span>
            ) : isInsufficientCoins ? (
              'ยอด Coin ไม่เพียงพอ'
            ) : isInsufficientGas ? (
              'Gas ไม่เพียงพอ'
            ) : (
              'ยืนยันจ้างงานและวางเงิน'
            )}
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {showMap && (
          <motion.div
            className="hire-map-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="hire-map-dialog"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <button type="button" className="hire-modal-close" onClick={() => setShowMap(false)} aria-label="Close map picker">
                <FiX />
              </button>

              <header className="hire-map-header">
                <span className="hire-modal-kicker"><FiMapPin /> Location Picker</span>
                <h3>เลือกตำแหน่งบนแผนที่</h3>
                <p>ค้นหาสถานที่หรือคลิกบนแผนที่เพื่อกำหนดจุดทำงาน</p>
              </header>

              <div className="hire-map-search">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อสถานที่..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSearchPlace();
                  }}
                />
                <button type="button" onClick={handleSearchPlace} disabled={isSearching}>
                  {isSearching ? <FiZap className="hire-spin" /> : <FiSearch />}
                </button>
              </div>

              <div ref={mapContainerRef} className="hire-map-canvas" />

              <div className="hire-selected-location">
                <span>ตำแหน่งที่เลือก</span>
                <p>{formData.location.address || 'คลิกเลือกตำแหน่งบนแผนที่...'}</p>
              </div>

              <button type="button" className="hire-submit-button" onClick={() => setShowMap(false)}>
                <FiCheck /> ตกลงและใช้ตำแหน่งนี้
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default HireModal;
