import { useState, useEffect, useContext } from 'react';
import { walletAPI, usersAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlusCircle, FiList, FiCheckCircle, FiUploadCloud, FiZap, FiChevronDown, FiInfo, FiArrowDownCircle, FiSend, FiBriefcase, FiCornerDownLeft, FiCopy, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { CoinIcon, CoinBadge, CoinTag } from '../../components/CoinIcon';

const THAI_BANKS = [
  { id: 'kbank', name: 'กสิกรไทย (K-Bank)', color: '#138B2E' },
  { id: 'scb', name: 'ไทยพาณิชย์ (SCB)', color: '#4E2E7F' },
  { id: 'bbl', name: 'กรุงเทพ (BBL)', color: '#1E4598' },
  { id: 'ktb', name: 'กรุงไทย (KTB)', color: '#00A1E0' },
  { id: 'bay', name: 'กรุงศรีอยุธยา (BAY)', color: '#FFD400' },
  { id: 'gsb', name: 'ออมสิน (GSB)', color: '#EB008B' },
  { id: 'ttb', name: 'ทีทีบี (TTB)', color: '#002D63' },
  { id: 'baac', name: 'ธ.ก.ส. (BAAC)', color: '#00A950' },
  { id: 'other', name: 'อื่นๆ (Other)', color: '#666666' }
];

function ManageWallet() {
  const { user, token: contextToken, fetchProfile } = useContext(AuthContext);
  const currentToken = contextToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
  const userInfoRaw = user || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
  const { socket } = useSocket();

  // Normalization
  const coinBal = userInfoRaw?.coinBalance ?? userInfoRaw?.balance ?? userInfoRaw?.coins ?? 0;
  const [balance, setBalance] = useState(coinBal);
  const [transactions, setTransactions] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState('topup'); // 'topup' or 'withdraw'

  // Top-up States
  const [amount, setAmount] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [anomaly, setAnomaly] = useState(null); // { code: string, message: string }
  const [showSuccess, setShowSuccess] = useState(null); // { amount: number, coins: number }

  // Withdrawal States
  const [wAmount, setWAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState(userInfoRaw?.bankAccount?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(userInfoRaw?.bankAccount?.accountNumber || '');
  const [wLoading, setWLoading] = useState(false);
  const [wStatusMsg, setWStatusMsg] = useState({ text: '', isSuccess: false });
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    if (currentToken) {
      fetchTransactions();
      if (fetchProfile) fetchProfile();

      const fetchSummary = async () => {
        try {
          const data = await usersAPI.getDashboardSummary(currentToken);
          setSummaryData(data);
        } catch (e) {
          console.error("Summary Fetch Error:", e);
        }
      };
      fetchSummary();
    }
  }, [currentToken]);

  // 🔄 Fallback: Calculate balance from transactions if profile shows 0 but history is present
  useEffect(() => {
    if (transactions.length > 0 && balance === 0) {
      const calculated = transactions.reduce((acc, tx) => {
        const amt = Number(tx.amount) || 0;
        const isPositive = ['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type);
        const isNegative = ['PAY_JOB', 'WITHDRAW'].includes(tx.type);
        return isPositive ? acc + amt : (isNegative ? acc - amt : acc);
      }, 0);
      if (calculated > 0) {
        setBalance(calculated);
      }
    }
  }, [transactions, balance]);

  // 🔄 Sync local balance when user data updates from context
  useEffect(() => {
    if (user?.coinBalance !== undefined) {
      setBalance(user.coinBalance);
    }
  }, [user]);

  // ⚡ Real-time Balance Updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleBalanceUpdate = (data) => {
      // console.log('⚡ Socket Balance Update:', data);
      if (data.coinBalance !== undefined) {
        setBalance(data.coinBalance);
        fetchTransactions(); // Refresh list to show new completion/proof
        if (fetchProfile) fetchProfile();
      }
    };

    socket.on('balance_update', handleBalanceUpdate);
    return () => socket.off('balance_update', handleBalanceUpdate);
  }, [socket, fetchProfile]);

  const fetchTransactions = async () => {
    if (!currentToken) return;
    try {
      const data = await walletAPI.getTransactions(currentToken);
      setTransactions(data);
    } catch (err) { console.error(err); }
  };

  const handleTopup = async (e) => {
    if (e) e.preventDefault();
    if (!amount || amount <= 0) return;
    if (!slipFile) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('slip', slipFile);

      await walletAPI.topupManual(formData);

      setAmount('');
      setSlipFile(null);
      if (fetchProfile) fetchProfile();
      fetchTransactions();

      setShowSuccess({
        amount: Number(amount),
        coins: Number(amount) / 10,
        isManual: true
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งหลักฐาน');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmount = Number(wAmount);
    if (!numAmount || numAmount <= 0) return;
    if (!bankName || !accountName || !accountNumber) {
      setWStatusMsg({ text: 'กรุณากรอกข้อมูลให้ครบถ้วน', isSuccess: false });
      return;
    }
    if (numAmount > balance) {
      setWStatusMsg({ text: 'ยอดเหรียญไม่เพียงพอ', isSuccess: false });
      return;
    }

    setWLoading(true);
    setWStatusMsg({ text: '', isSuccess: false });
    try {
      await walletAPI.requestWithdraw(
        { amount: numAmount, bankName, accountName, accountNumber },
        currentToken
      );
      setWStatusMsg({ text: 'ส่งคำขอถอนเงินสำเร็จ! ทีมงานจะตรวจสอบและดำเนินการใน 1-3 วัน', isSuccess: true });
      setWAmount('');
      if (fetchProfile) fetchProfile();
      fetchTransactions();
    } catch (err) {
      const data = err.response?.data;
      if (data?.status === 'ANOMALY') {
        setAnomaly({ code: data.code, message: data.message });
      } else {
        setWStatusMsg({ text: data?.message || 'เกิดข้อผิดพลาดในการส่งคำขอ', isSuccess: false });
      }
    } finally {
      setWLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="wallet-main-container"
    >

      {/* 🧬 Left: Top-up Ingestion Terminal */}
      <motion.div variants={itemVariants}>
        <header style={{ marginBottom: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <FiZap color="var(--accent)" size={18} />
            <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.8rem' }}>WALLET SYSTEM</span>
          </div>
          <h1 className="wallet-title" style={{ fontWeight: '700', margin: 0, letterSpacing: '-px', lineHeight: 1 }}>
            <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>MY WALLET</span>
          </h1>
          <p style={{ color: '#444', marginTop: '15px', fontWeight: '700', letterSpacing: '1px', fontSize: '1.1rem' }}>ตรวจสอบความเคลื่อนไหวและบริหารจัดการเหรียญสะสมของคุณ</p>

        </header>

        {/* Balance Node & Quick Actions */}
        <div className="wallet-top-grid">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass balance-card"
            style={{ display: 'flex', alignItems: 'center', gap: '30px', padding: '40px', borderRadius: '40px', border: '1px solid rgba(255,87,51,0.2)', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.05 }}></div>
            <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '2.5rem', border: '1px solid rgba(245,158,11,0.1)' }}>
              <CoinIcon size={38} />
            </div>
            <div>
              <p style={{ color: '#222', fontSize: '0.65rem', fontWeight: '700', marginBottom: '5px', letterSpacing: '1px' }}>AVAILABLE COINS</p>
              <CoinBadge amount={balance} size="lg" />
            </div>

          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab('withdraw')}
            className="glass"
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px', borderRadius: '40px',
              border: `1px solid ${activeTab === 'withdraw' ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
              background: activeTab === 'withdraw' ? 'rgba(255,87,51,0.05)' : 'transparent',
              cursor: 'pointer', transition: '0.3s'
            }}
          >
            <p style={{ color: activeTab === 'withdraw' ? 'var(--accent)' : '#444', fontSize: '0.65rem', fontWeight: '700', marginBottom: '10px', letterSpacing: '1px' }}>ถอนเหรียญสะสม</p>
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: activeTab === 'withdraw' ? '#fff' : '#444' }}>ต้องการถอนเงิน?</h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: activeTab === 'withdraw' ? 'var(--accent)' : '#222', fontWeight: '700' }}>{activeTab === 'withdraw' ? 'กำลังดำเนินการ...' : 'คลิกแจ้งถอน Coins ที่นี่'}</p>
          </motion.div>
        </div>

        {/* 🧬 Tabbed Controller */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <button
            onClick={() => setActiveTab('topup')}
            style={{
              background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer',
              color: activeTab === 'topup' ? '#fff' : '#444', fontWeight: '700',
              borderBottom: activeTab === 'topup' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: '0.3s', fontSize: '0.9rem', letterSpacing: '2px'
            }}
          >
            เติมเหรียญ / RECHARGE
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            style={{
              background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer',
              color: activeTab === 'withdraw' ? '#fff' : '#444', fontWeight: '700',
              borderBottom: activeTab === 'withdraw' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: '0.3s', fontSize: '0.9rem', letterSpacing: '2px'
            }}
          >
            ถอนเหรียญ / CASH OUT
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'topup' ? (
            <motion.div key="topup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass glass-panel" style={{ borderRadius: '50px', padding: '50px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="topup-form-grid" style={{ display: 'grid', gap: '50px' }}>
                  {/* Left: Form */}
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <FiPlusCircle color="var(--accent)" /> แจ้งเติมเหรียญ (Manual)
                    </h3>

                    <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginBottom: '12px' }}>จำนวนเงินที่โอน (THB)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="ระบุจำนวนเงิน เช่น 100"
                        style={{ width: '100%', padding: '20px 25px', borderRadius: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '1.1rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ marginTop: '10px', color: 'var(--accent)', fontWeight: '700', fontSize: '0.85rem' }}>
                        * ฿10 = 1 Coin (เติมขั้นต่ำ ฿10)
                      </div>
                    </div>

                    <div style={{ marginBottom: '35px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginBottom: '12px' }}>แนบหลักฐานการโอน (สลิป)</label>
                      <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px',
                        padding: '40px', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.05)', background: slipFile ? 'rgba(255,87,51,0.05)' : 'rgba(255,255,255,0.01)',
                        cursor: 'pointer', transition: '0.3s'
                      }}>
                        <input type="file" accept="image/*" hidden onChange={(e) => setSlipFile(e.target.files[0])} />
                        {slipFile ? (
                          <>
                            <FiCheckCircle color="#22c55e" size={32} />
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ color: '#fff', fontWeight: '700', margin: 0 }}>{slipFile.name}</p>
                              <p style={{ color: '#444', fontSize: '0.7rem', marginTop: '5px' }}>คลิกเพื่อเปลี่ยนรูป</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <FiUploadCloud color="#222" size={32} />
                            <p style={{ color: '#444', fontWeight: '700', margin: 0 }}>คลิกเพื่ออัปโหลดรูปสลิป</p>
                          </>
                        )}
                      </label>
                    </div>

                    {errorMsg && (
                      <div style={{ padding: '15px 25px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '25px', fontSize: '0.85rem', fontWeight: '700' }}>
                        {errorMsg}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px var(--accent-glow)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTopup}
                      disabled={loading || !amount || !slipFile}
                      className="withdraw-btn"
                      style={{ width: '100%', padding: '22px', borderRadius: '25px', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    >
                      {loading ? 'กำลังส่งข้อมูล...' : <><FiCheckCircle /> ส่งหลักฐานการโอนเงิน</>}
                    </motion.button>
                  </div>

                  {/* Right: Bank Info */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '40px', padding: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <h4 style={{ color: '#444', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '30px' }}>ช่องทางการโอนเงิน</h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#138B2E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: '900' }}>K</div>
                      <div>
                        <p style={{ color: '#444', fontSize: '0.7rem', fontWeight: '800', margin: 0, letterSpacing: '1px' }}>ธนาคารกสิกรไทย</p>
                        <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '900', margin: '5px 0' }}>159-1-37596-9</p>
                        <p style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>ชื่อบัญชี: วัชรพงศ์ เสือสง่า</p>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '25px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <FiInfo color="var(--accent)" size={20} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.6', fontWeight: '600' }}>
                          <span style={{ color: '#fff', fontWeight: '800' }}>ขั้นตอนการเติมเงิน:</span><br />
                          1. โอนเงินเข้าบัญชีด้านบนตามจำนวนที่ต้องการ<br />
                          2. ระบุจำนวนเงินและแนบรูปสลิปในฟอร์ม<br />
                          3. กดส่งหลักฐานและรอแอดมินตรวจสอบ<br />
                          4. เมื่ออนุมัติแล้ว เหรียญจะเข้าบัญชีทันที
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="withdraw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass glass-panel" style={{ borderRadius: '50px', padding: '50px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '40px', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  แจ้งถอนเหรียญเข้าบัญชี
                </h3>

                <div className="wallet-withdraw-grid">
                  <div>
                    {/* Amount Field */}
                    <div style={{ marginBottom: '35px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginBottom: '15px' }}>จำนวนเหรียญที่ต้องการถอน</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number" min="1" max={balance}
                          value={wAmount}
                          onChange={(e) => setWAmount(e.target.value)}
                          placeholder="0.00"
                          style={{ width: '100%', padding: '22px 22px 22px 65px', borderRadius: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '1.6rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }}><CoinIcon size={28} /></div>
                      </div>
                      {wAmount > 0 && (
                        <div style={{ marginTop: '12px', color: '#f59e0b', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FiCheckCircle /> ≈ ฿{(Number(wAmount) * 10).toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(1 Coin = ฿10)</span>
                        </div>
                      )}
                    </div>

                    {/* Bank Selection */}
                    <div style={{ marginBottom: '30px', position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginBottom: '10px' }}>เลือกธนาคารปลายทาง</label>
                      <div
                        onClick={() => setShowBankDropdown(!showBankDropdown)}
                        style={{ width: '100%', padding: '18px 25px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: bankName ? '#fff' : '#444', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        {bankName || 'คลิกเพื่อเลือกธนาคาร...'}
                        <FiChevronDown style={{ transform: showBankDropdown ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                      </div>
                      <AnimatePresence>
                        {showBankDropdown && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', marginTop: '10px', maxHeight: '200px', overflowY: 'auto', padding: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            {THAI_BANKS.map(bank => (
                              <div key={bank.id} onClick={() => { setBankName(bank.name); setShowBankDropdown(false); }} style={{ padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', color: '#fff', fontWeight: '700', transition: '0.2s', background: bankName === bank.name ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bank.color }} />
                                {bank.name}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginBottom: '10px' }}>ชื่อบัญชี</label>
                      <input
                        type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                        placeholder="ชื่อบัญชีธนาคาร..."
                        style={{ width: '100%', padding: '18px 25px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#222', fontWeight: '700', letterSpacing: '2px', marginBottom: '10px' }}>เลขบัญชี</label>
                      <input
                        type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                        placeholder="000-0-00000-0"
                        style={{ width: '100%', padding: '18px 25px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <AnimatePresence>
                      {wStatusMsg.text && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '18px', borderRadius: '20px', marginBottom: '25px', fontSize: '0.85rem', fontWeight: '700', background: wStatusMsg.isSuccess ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: wStatusMsg.isSuccess ? '#22c55e' : '#ef4444', border: `1px solid ${wStatusMsg.isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                          {wStatusMsg.text}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 15px 40px var(--accent-glow)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWithdrawSubmit}
                      disabled={wLoading || !wAmount}
                      style={{ width: '100%', padding: '22px', borderRadius: '25px', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: '1.2rem', fontWeight: '700', cursor: 'pointer', opacity: wLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    >
                      {wLoading ? 'กำลังส่งคำขอ...' : <><FiSend /> ยืนยันการถอนเหรียญ</>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 📡 Right: Logistics Stream (History) */}
      <motion.div variants={itemVariants}>
        <header style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <FiList color="#222" size={18} />
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0, letterSpacing: '-px' }}>ประวัติรายการ</h2>
          <p style={{ color: '#222', fontWeight: '700', letterSpacing: '1px', marginTop: '10px' }}>รีคอร์ดการเคลื่อนไหวของกระแสเงินทั้งหมด</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {transactions.length === 0 ? (
            <div className="glass" style={{ padding: '80px', textAlign: 'center', borderRadius: '50px', color: '#111', fontWeight: '700', letterSpacing: '4px' }}>
              ยังไม่มีประวัติการทำรายการ
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <motion.div
                key={tx._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass transaction-item"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.03)' }}
              >
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: tx.type === 'TOPUP' ? 'var(--accent)' : '#6366f1', boxShadow: `0 0 15px ${tx.type === 'TOPUP' ? 'var(--accent-glow)' : 'rgba(99,102,241,0.5)'}` }} />
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
                      {({ TOPUP: 'เติมเหรียญสะสม', PAY_JOB: 'จ่ายค่าบริการ', EARN_JOB: 'รายได้จากการทำงาน', WITHDRAW: 'คำขอถอนเงิน', REFUND: 'คืนเงินเข้าระบบ' })[tx.type] || tx.type}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#333', fontWeight: '700', marginTop: '6px' }}>{new Date(tx.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div className="transaction-meta" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '8px' }}>
                  <CoinTag amount={tx.amount} positive={['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type)} />
                  <div style={{ fontSize: '0.65rem', color: '#111', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Status: {tx.status}</div>

                  {/* 🧾 View Receipt Button for Withdrawals */}
                  {tx.type === 'WITHDRAW' && tx.status === 'completed' && tx.proofImage?.url && (
                    <button
                      onClick={() => window.open(tx.proofImage.url, '_blank')}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      <FiInfo size={12} />
                      ดูหลักฐานการโอน
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* 🚨 SECURITY ANOMALY MODAL [NEO-CYBER RED ALERT] */}
      <AnimatePresence>
        {anomaly && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{
                padding: '60px', borderRadius: '40px', maxWidth: '600px', width: '100%',
                border: '2px solid #ef4444', textAlign: 'center',
                boxShadow: '0 0 100px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.1)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Animated Background Glitch */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: 'rgba(239,68,68,0.3)', filter: 'blur(5px)' }} className="scanline" />
              <style>{`
                @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
                .scanline { animation: scan 3s linear infinite; }
              `}</style>

              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 30px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <FiInfo size={50} />
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ef4444', marginBottom: '15px', letterSpacing: '4px' }}>
                SYSTEM ANOMALY DETECTED
              </h2>
              <div style={{ display: 'inline-block', background: 'rgba(239,68,68,0.1)', padding: '5px 15px', borderRadius: '10px', fontSize: '0.7rem', color: '#ef4444', fontWeight: '700', marginBottom: '25px', letterSpacing: '2px', border: '1px solid rgba(239,68,68,0.2)' }}>
                CODE: {anomaly.code}
              </div>

              <p style={{ fontSize: '1.2rem', color: '#fff', lineHeight: '1.6', marginBottom: '40px', fontWeight: '600' }}>
                {anomaly.message}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button
                  onClick={() => setAnomaly(null)}
                  style={{ width: '100%', padding: '20px', borderRadius: '15px', background: 'linear-gradient(45deg, #ef4444, #b91c1c)', border: 'none', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239,68,68,0.3)' }}
                >
                  ACKNOWLEDGE & DISMISS
                </button>
                <p style={{ fontSize: '0.75rem', color: '#444', fontWeight: '700' }}>
                  SECURITY LOG ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎉 SUCCESS CELEBRATION MODAL [NEO-CYBER GREEN] */}
      <AnimatePresence>
        {showSuccess && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.5, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 100, opacity: 0 }}
              className="glass"
              style={{
                padding: '60px', borderRadius: '50px', maxWidth: '550px', width: '100%',
                border: '2px solid #22c55e', textAlign: 'center',
                boxShadow: '0 0 80px rgba(34, 197, 94, 0.15)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Confetti-like Glows */}
              <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', opacity: 0.1 }} />
              <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', opacity: 0.1 }} />

              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', margin: '0 auto 40px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <FiCheckCircle size={65} />
              </div>

              <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', marginBottom: '10px', letterSpacing: '-1px' }}>
                {showSuccess.isWithdraw ? 'คำขอถอนเงินส่งแล้ว!' : (showSuccess.isManual ? 'ส่งหลักฐานสำเร็จ!' : 'เติมเหรียญสำเร็จ!')}
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#888', fontWeight: '500', marginBottom: '35px' }}>
                {showSuccess.isWithdraw ? 'ทีมงานกำลังตรวจสอบข้อมูลของคุณ' : (showSuccess.isManual ? 'กรุณารอแอดมินตรวจสอบสลิปและส่งเหรียญให้คุณ' : 'ยอดเหรียญของคุณได้รับการอัปเดตเรียบร้อยแล้ว')}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '45px' }}>
                <div style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>
                  {showSuccess.isWithdraw ? 'WITHDRAWAL AMOUNT' : 'COINS CREDITED'}
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                  <CoinIcon size={40} />
                  {showSuccess.coins.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#444', fontWeight: '700', marginTop: '10px' }}>
                  ≈ ฿{showSuccess.amount.toLocaleString()} THB
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(34,197,94,0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccess(null)}
                style={{ width: '100%', padding: '22px', borderRadius: '20px', background: '#22c55e', border: 'none', color: '#fff', fontWeight: '700', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                AWESOME!
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .wallet-main-container {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) 1fr;
          gap: clamp(30px, 5vw, 60px);
          padding-bottom: clamp(60px, 10vw, 120px);
        }

        .wallet-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          letter-spacing: -2px;
        }

        .wallet-top-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: clamp(15px, 2vw, 25px);
          margin-bottom: clamp(30px, 5vw, 50px);
        }

        .topup-form-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: clamp(30px, 4vw, 50px);
        }

        .wallet-withdraw-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: clamp(30px, 5vw, 60px);
        }

        .glass-panel {
           border-radius: clamp(30px, 5vw, 50px) !important;
           padding: clamp(20px, 5vw, 50px) !important;
        }

        /* ── RESPONSIVE OVERRIDES ── */
        @media (max-width: 1100px) {
          .wallet-main-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .topup-form-grid,
          .wallet-withdraw-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .wallet-top-grid {
            grid-template-columns: 1fr;
          }
          
          .wallet-title {
            line-height: 1.1;
          }

          .transaction-item {
             padding: 20px !important;
             flex-direction: column;
             align-items: flex-start !important;
             gap: 20px;
          }

          .transaction-meta {
             width: 100%;
             text-align: left !important;
             align-items: flex-start !important;
          }
        }

        @media (max-width: 480px) {
          .glass-panel {
            padding: 20px !important;
            border-radius: 25px !important;
          }
          
          .balance-card {
            flex-direction: column;
            align-items: flex-start !important;
            padding: 25px !important;
            gap: 15px !important;
          }
          
          .withdraw-btn {
            font-size: 1rem !important;
            padding: 18px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default ManageWallet;
