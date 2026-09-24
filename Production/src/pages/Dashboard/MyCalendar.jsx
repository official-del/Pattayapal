import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiLock, FiUnlock, FiDollarSign, FiUser, FiClock, FiBriefcase } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO, addDays, startOfDay } from 'date-fns';
import { calendarAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import PremiumLoader from '../../components/PremiumLoader';

const STATUS_LABELS = {
  pending:   { label: 'รอตอบรับ',   color: '#fbca1f' },
  accepted:  { label: 'กำลังทำงาน', color: '#22d3ee' },
  completed: { label: 'เสร็จสิ้น',  color: '#4ade80' },
  cancelled: { label: 'ยกเลิก',     color: '#f87171' },
};

function MyCalendar() {
  const { user } = useContext(AuthContext);
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [localBusyDates, setLocalBusyDates] = useState([]);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const data = await calendarAPI.getMyCalendar();
      setCalendarData(data);
      setLocalBusyDates(data.busyDates || []);
    } catch (err) {
      toast.error('โหลดปฏิทินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // วันที่มีงานจากคิวงาน (ล็อกอัตโนมัติ)
  const jobDates = calendarData?.jobs?.map(j => j.workDate).filter(Boolean) || [];

  const toggleBusyDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];

    // ไม่สามารถเปลี่ยนวันที่มีงานอยู่แล้ว
    if (jobDates.includes(dateStr)) {
      toast.error('วันนี้มีงานจ้างอยู่แล้ว ไม่สามารถปลดล็อกได้');
      return;
    }

    setLocalBusyDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)   // ปลดล็อก
        : [...prev, dateStr]                  // ล็อก
    );
  };

  const saveBusyDates = async () => {
    setSaving(true);
    try {
      await calendarAPI.updateBusyDates(localBusyDates);
      toast.success('บันทึกวันว่างสำเร็จ!');
      fetchCalendar();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Jobs ของวันที่เลือก
  const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const jobsOnSelectedDate = selectedDateStr
    ? (calendarData?.jobs || []).filter(j => j.workDate === selectedDateStr)
    : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <PremiumLoader />
      </div>
    );
  }

  return (
    <div className="my-calendar-page">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-calendar-container"
      >
        {/* ── Header ── */}
        <div className="cal-header">
          <div>
            <span className="cal-kicker"><FiCalendar /> ปฏิทินงาน</span>
            <h1>ตารางคิวของฉัน</h1>
            <p>จัดการวันรับงานและดูรายละเอียดคิวงานทั้งหมด</p>
          </div>
          <button
            className="cal-save-btn"
            onClick={saveBusyDates}
            disabled={saving}
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกตารางงาน'}
          </button>
        </div>

        <div className="cal-layout">
          {/* ── ปฏิทิน ── */}
          <div className="cal-picker-section">
            <div className="cal-legend">
              <span className="legend-item"><span className="dot dot-job" /> มีงาน (ถูกจ้าง)</span>
              <span className="legend-item"><span className="dot dot-blocked" /> ล็อกส่วนตัว</span>
              <span className="legend-item"><span className="dot dot-selected" /> วันที่เลือก</span>
            </div>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                toggleBusyDate(date);
              }}
              minDate={new Date()}
              excludeDates={[]}
              dayClassName={(date) => {
                const dateStr = date.toISOString().split('T')[0];
                if (jobDates.includes(dateStr)) return 'cal-day-job';
                if (localBusyDates.includes(dateStr)) return 'cal-day-blocked';
                return undefined;
              }}
              renderDayContents={(day, date) => {
                const dateStr = date.toISOString().split('T')[0];
                const hasJob = jobDates.includes(dateStr);
                const isBlocked = localBusyDates.includes(dateStr);
                return (
                  <span className="cal-day-inner">
                    {day}
                    {hasJob && <span className="cal-dot-job" title="มีงาน" />}
                    {isBlocked && !hasJob && <FiLock size={8} className="cal-lock-icon" />}
                  </span>
                );
              }}
              inline
            />
            <div className="cal-tip">
              💡 คลิกวันที่ในปฏิทินเพื่อล็อก/ปลดล็อกวันหยุดส่วนตัว
            </div>
          </div>

          {/* ── รายละเอียด Job ── */}
          <div className="cal-jobs-section">
            {selectedDate ? (
              <>
                <h3 className="cal-day-title">
                  📋 {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>

                {jobsOnSelectedDate.length === 0 ? (
                  <div className="cal-empty-day">
                    {localBusyDates.includes(selectedDateStr) ? (
                      <>
                        <FiLock size={28} />
                        <p>ล็อกวันนี้ไว้แล้ว ไม่รับงานใหม่</p>
                        <small>คลิกปฏิทินอีกครั้งเพื่อปลดล็อก</small>
                      </>
                    ) : (
                      <>
                        <FiCalendar size={28} />
                        <p>ว่างทั้งวัน ยังไม่มีงาน</p>
                        <small>คลิกปฏิทินเพื่อล็อกวันหยุดส่วนตัว</small>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="cal-job-list">
                    {jobsOnSelectedDate.map((job) => {
                      const status = STATUS_LABELS[job.status] || STATUS_LABELS.pending;
                      return (
                        <motion.div
                          key={job._id}
                          className="cal-job-card"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="cal-job-status" style={{ background: status.color + '22', color: status.color, borderColor: status.color + '55' }}>
                            {status.label}
                          </div>
                          <h4>{job.title}</h4>
                          <div className="cal-job-meta">
                            <span><FiUser size={13} /> {job.employer?.name || 'ผู้ว่าจ้าง'}</span>
                            <span><FiDollarSign size={13} /> {job.budget?.toLocaleString()} Coins</span>
                          </div>
                          {job.description && (
                            <p className="cal-job-desc">{job.description.slice(0, 120)}{job.description.length > 120 ? '...' : ''}</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="cal-no-selection">
                <FiCalendar size={40} />
                <p>เลือกวันในปฏิทินเพื่อดูรายละเอียดงาน</p>
              </div>
            )}

            {/* ── สรุปภาพรวม ── */}
            <div className="cal-stats">
              <div className="cal-stat-card">
                <FiBriefcase size={20} />
                <span>{(calendarData?.jobs || []).filter(j => j.status === 'accepted' || j.status === 'pending').length}</span>
                <small>งานที่รอ/ทำอยู่</small>
              </div>
              <div className="cal-stat-card">
                <FiLock size={20} />
                <span>{localBusyDates.length - jobDates.filter(d => localBusyDates.includes(d)).length}</span>
                <small>วันล็อกส่วนตัว</small>
              </div>
              <div className="cal-stat-card">
                <FiDollarSign size={20} />
                <span>{(calendarData?.jobs || []).filter(j => j.status !== 'cancelled').reduce((sum, j) => sum + (j.budget || 0), 0).toLocaleString()}</span>
                <small>มูลค่างานรวม (Coins)</small>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .my-calendar-page { padding: clamp(20px, 4vw, 40px); min-height: 100vh; }
        .my-calendar-container { max-width: 1000px; margin: 0 auto; }

        .cal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
        }
        .cal-kicker {
          display: inline-flex; align-items: center; gap: 6px;
          color: #fbca1f; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
        }
        .cal-header h1 { margin: 0; color: #fff; font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; }
        .cal-header p { margin: 4px 0 0; color: rgba(255,255,255,0.5); font-size: 14px; }
        .cal-save-btn {
          padding: 12px 24px; border-radius: 10px; border: 2px solid #000;
          background: #fbca1f; color: #080808; font-weight: 800; font-size: 14px;
          cursor: pointer; box-shadow: 3px 3px 0 #000;
          transition: all 0.15s ease; white-space: nowrap;
        }
        .cal-save-btn:hover:not(:disabled) { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 #000; }
        .cal-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .cal-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 700px) { .cal-layout { grid-template-columns: 1fr; } }

        .cal-picker-section { display: flex; flex-direction: column; gap: 14px; }

        .cal-legend { display: flex; gap: 14px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.6); font-size: 12px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-job { background: #fbca1f; }
        .dot-blocked { background: #f87171; }
        .dot-selected { background: #60a5fa; }

        .cal-tip { color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; }

        /* Calendar day styles */
        .cal-day-inner { position: relative; display: inline-block; }
        .cal-dot-job {
          position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
          width: 5px; height: 5px; border-radius: 50%; background: #fbca1f;
        }
        .cal-lock-icon { position: absolute; bottom: -1px; right: -2px; color: #f87171; }
        .cal-day-job.react-datepicker__day {
          background: rgba(251,202,31,0.15) !important;
          color: #fbca1f !important; font-weight: 700 !important;
        }
        .cal-day-blocked.react-datepicker__day {
          background: rgba(248,113,113,0.1) !important;
          color: rgba(248,113,113,0.8) !important;
        }

        /* Jobs panel */
        .cal-jobs-section { display: flex; flex-direction: column; gap: 16px; }
        .cal-day-title { margin: 0; color: #fff; font-size: 15px; font-weight: 700; }

        .cal-empty-day {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 40px 20px; border-radius: 12px;
          border: 1px dashed rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4); text-align: center;
        }
        .cal-empty-day p { margin: 0; font-size: 15px; }
        .cal-empty-day small { font-size: 12px; }

        .cal-no-selection {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 60px 20px;
          color: rgba(255,255,255,0.3); text-align: center;
        }
        .cal-no-selection p { margin: 0; font-size: 15px; }

        .cal-job-list { display: flex; flex-direction: column; gap: 12px; }
        .cal-job-card {
          padding: 16px; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .cal-job-status {
          display: inline-block; padding: 3px 10px; border-radius: 6px;
          font-size: 12px; font-weight: 700; border: 1px solid; margin-bottom: 8px;
        }
        .cal-job-card h4 { margin: 0 0 8px; color: #fff; font-size: 15px; font-weight: 700; }
        .cal-job-meta { display: flex; gap: 14px; flex-wrap: wrap; }
        .cal-job-meta span { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.55); font-size: 13px; }
        .cal-job-desc { margin: 10px 0 0; color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.5; }

        .cal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: auto; }
        .cal-stat-card {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 14px 8px; border-radius: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          text-align: center;
        }
        .cal-stat-card svg { color: #fbca1f; }
        .cal-stat-card span { color: #fff; font-size: 20px; font-weight: 800; }
        .cal-stat-card small { color: rgba(255,255,255,0.45); font-size: 11px; }
      `}</style>
    </div>
  );
}

export default MyCalendar;
