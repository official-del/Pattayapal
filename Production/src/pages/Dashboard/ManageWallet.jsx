import { useState, useEffect, useContext } from 'react';
import { walletAPI, usersAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlusCircle, FiList, FiCheckCircle, FiUploadCloud, FiZap, FiChevronDown, FiInfo, FiArrowDownCircle, FiSend, FiBriefcase, FiCornerDownLeft, FiCopy, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { CoinIcon, CoinBadge, CoinTag } from '../../components/CoinIcon';
import GasIcon from '../../components/GasIcon';
import kbankLogo from '../../assets/kasikorn-logo.jpg';

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
  const gasBal = userInfoRaw?.gasBalance ?? 0;
  const [balance, setBalance] = useState(coinBal);
  const [gasBalance, setGasBalance] = useState(gasBal);
  const [transactions, setTransactions] = useState([]);

  // Tabs
  const [activeTab, setActiveTab] = useState('topup'); // 'topup' or 'withdraw' or 'gas'

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

  // Gas Refill States
  const [gasLoading, setGasLoading] = useState(false);
  const [gasErrorMsg, setGasErrorMsg] = useState('');
  const [selectedGasPercent, setSelectedGasPercent] = useState(100);

  const [summaryData, setSummaryData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

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
    if (user?.coinBalance !== undefined) setBalance(user.coinBalance);
    if (user?.gasBalance !== undefined) setGasBalance(user.gasBalance);
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
      if (data.gasBalance !== undefined) {
        setGasBalance(data.gasBalance);
        if (fetchProfile) fetchProfile();
      }
    };

    socket.on('balance_update', handleBalanceUpdate);
    return () => socket.off('balance_update', handleBalanceUpdate);
  }, [socket, fetchProfile]);

  // 🕵️ Toggle Navbar visibility when Drawer is open
  useEffect(() => {
    if (showHistory) {
      document.body.classList.add('hide-navbar-icons');
    } else {
      document.body.classList.remove('hide-navbar-icons');
    }
    return () => document.body.classList.remove('hide-navbar-icons');
  }, [showHistory]);

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
        coins: Number(amount) * 10,
        isManual: true,
        type: 'topup'
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
      setShowSuccess({ isWithdraw: true, coins: numAmount, amount: numAmount / 10, type: 'withdraw' });
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

  const handleRefillGas = async (e) => {
    if (e) e.preventDefault();
    const cost = selectedGasPercent * 10;
    if (balance < cost) {
      setGasErrorMsg(`ยอดเหรียญไม่เพียงพอ (ต้องการ ${cost.toLocaleString()} Coins)`);
      return;
    }

    setGasLoading(true);
    setGasErrorMsg('');
    try {
      const res = await walletAPI.refillGas({ percent: selectedGasPercent });
      setGasBalance(res.gasBalance);
      if (fetchProfile) fetchProfile();
      fetchTransactions();
      
      setShowSuccess({
        isGas: true,
        coins: cost,
        amount: selectedGasPercent,
        type: 'gas'
      });
    } catch (err) {
      setGasErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเติม Gas');
    } finally {
      setGasLoading(false);
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
          <div className="wallet-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="wallet-title" style={{ fontWeight: '700', margin: 0, letterSpacing: '-px', lineHeight: 1 }}>
                <span style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 15px var(--accent-glow))' }}>MY WALLET</span>
              </h1>
              <p className="wallet-subtitle" style={{ color: '#444', marginTop: '10px', fontWeight: '700', letterSpacing: '1px' }}>ตรวจสอบความเคลื่อนไหวและบริหารจัดการเหรียญสะสมของคุณ</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHistory(true)}
              style={{
                width: '60px', height: '60px', borderRadius: '20px', 
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                cursor: 'pointer', transition: '0.3s'
              }}
            >
              <FiList size={24} />
            </motion.button>
          </div>

        </header>

        {/* Balance Node & Quick Actions */}
        <div className="wallet-top-grid">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass balance-card coin-card"
            style={{ display: 'flex', alignItems: 'center', borderRadius: '40px', border: '1px solid rgba(255,87,51,0.2)', position: 'relative', overflow: 'hidden' }}
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
            className="glass balance-card gas-card"
            style={{ display: 'flex', alignItems: 'center', borderRadius: '40px', border: '1px solid rgba(16, 185, 129, 0.2)', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', opacity: 0.05 }}></div>
            <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GasIcon gas={gasBalance} size="100%" />
            </div>
            <div>
              <p style={{ color: '#222', fontSize: '0.65rem', fontWeight: '700', marginBottom: '5px', letterSpacing: '1px' }}>GAS ENERGY</p>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                {gasBalance}<span style={{ fontSize: '1rem' }}>%</span>
              </h2>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab('withdraw')}
            className="glass balance-card withdraw-info-card"
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '40px',
              border: `1px solid ${activeTab === 'withdraw' ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
              background: activeTab === 'withdraw' ? 'rgba(255,87,51,0.05)' : 'transparent',
              cursor: 'pointer', transition: '0.3s'
            }}
          >
            <p style={{ color: activeTab === 'withdraw' ? 'var(--accent)' : '#444', fontSize: '0.65rem', fontWeight: '700', marginBottom: '10px', letterSpacing: '1px' }}>ถอนเหรียญสะสม</p>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: activeTab === 'withdraw' ? '#fff' : '#444' }}>ต้องการถอนเงิน?</h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: activeTab === 'withdraw' ? 'var(--accent)' : '#222', fontWeight: '700' }}>{activeTab === 'withdraw' ? 'กำลังดำเนินการ...' : 'คลิกแจ้งถอน Coins ที่นี่'}</p>
          </motion.div>
        </div>

        {/* 🧬 Tabbed Controller */}
        <div className="wallet-tabs-container" style={{ display: 'flex', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
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
          <button
            onClick={() => setActiveTab('gas')}
            style={{
              background: 'none', border: 'none', padding: '20px 0', cursor: 'pointer',
              color: activeTab === 'gas' ? '#10b981' : '#444', fontWeight: '700',
              borderBottom: activeTab === 'gas' ? '2px solid #10b981' : '2px solid transparent',
              transition: '0.3s', fontSize: '0.9rem', letterSpacing: '2px'
            }}
          >
            เติม GAS / REFILL GAS
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'topup' ? (
            <motion.div key="topup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass-panel-new" style={{ borderRadius: '40px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden', backdropFilter: 'blur(10px)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
                <div className="topup-form-grid">
                  
                  {/* Left: Interactive Form */}
                  <div className="topup-form-left" style={{ borderRight: '1px solid rgba(255,255,255,0.03)', background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, transparent 100%)' }}>
                    <div style={{ marginBottom: '50px' }}>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '20px', color: '#fff', letterSpacing: '-1px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(255,87,51,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiPlusCircle color="var(--accent)" size={32} />
                        </div>
                        เติมเหรียญด้วยสลิป
                      </h3>
                      <p style={{ color: '#555', fontSize: '0.9rem', fontWeight: '600', marginLeft: '80px' }}>แจ้งข้อมูลการโอนเงินเพื่อให้แอดมินตรวจสอบยอดเข้าบัญชี</p>
                    </div>

                    <div className="coin-conversion-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '15px', textTransform: 'uppercase' }}>จำนวนเงินที่โอน (THB)</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ width: '100%', padding: '20px 20px 20px 55px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '1.4rem', fontWeight: '900', outline: 'none', boxSizing: 'border-box', transition: '0.3s', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}
                          />
                          <div style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', fontSize: '1.4rem', fontWeight: '900' }}>฿</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255,87,51,0.03)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,87,51,0.05)' }}>
                        <span style={{ color: '#666', fontWeight: '700', fontSize: '0.8rem', marginBottom: '5px' }}>คุณจะได้รับเหรียญประมาณ</span>
                        <span style={{ color: 'var(--accent)', fontWeight: '900', fontSize: '1.5rem' }}>{(Number(amount || 0) * 10).toLocaleString()} <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>COINS</span></span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '45px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '15px', textTransform: 'uppercase' }}>หลักฐานการโอน (Receipt)</label>
                      <label className="upload-label" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
                        padding: '40px 30px', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.08)', 
                        background: slipFile ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.01)',
                        cursor: 'pointer', transition: '0.3s', position: 'relative', overflow: 'hidden'
                      }}>
                        <input type="file" accept="image/*" hidden onChange={(e) => setSlipFile(e.target.files[0])} />
                        {slipFile ? (
                          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}>
                              <FiCheckCircle size={35} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ color: '#fff', fontWeight: '900', margin: 0, fontSize: '1.1rem' }}>{slipFile.name}</p>
                              <p style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: '800', marginTop: '5px' }}>อัปโหลดสลิปเรียบร้อยแล้ว (คลิกเพื่อเปลี่ยน)</p>
                            </div>
                          </motion.div>
                        ) : (
                          <>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                              <FiUploadCloud size={40} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ color: '#fff', fontWeight: '900', margin: 0, fontSize: '1.2rem' }}>คลิกเพื่อเลือกไฟล์สลิป</p>
                              <p style={{ color: '#555', fontSize: '0.9rem', fontWeight: '700', marginTop: '8px' }}>รองรับไฟล์ภาพ JPG, PNG ทุกขนาด</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    {errorMsg && (
                      <div style={{ padding: '20px 30px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '30px', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <FiInfo size={24} /> {errorMsg}
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 25px 50px var(--accent-glow)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTopup}
                      disabled={loading || !amount || !slipFile}
                      style={{ width: '100%', padding: '20px', borderRadius: '25px', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer', opacity: (loading || !amount || !slipFile) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', transition: '0.3s', boxShadow: '0 10px 30px rgba(255,87,51,0.3)' }}
                    >
                      {loading ? 'กำลังดำเนินการ...' : <><FiSend /> ยืนยันและส่งข้อมูลการโอนเงิน</>}
                    </motion.button>
                  </div>

                  {/* Right: Payment Destination & Guide */}
                  <div className="topup-form-right" style={{ background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '45px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#444', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '25px' }}>บัญชีปลายทาง</label>
                      
                      <div className="glass bank-card-visual" style={{ borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, #138B2E 0%, transparent 70%)', opacity: 0.1 }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                          <img src={kbankLogo} alt="KBank Logo" style={{ width: '55px', height: '55px', borderRadius: '15px', objectFit: 'cover', boxShadow: '0 10px 20px rgba(19,139,46,0.3)' }} />
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#444', fontSize: '0.65rem', fontWeight: '800', margin: 0, letterSpacing: '1px' }}>KASIKORNBANK</p>
                            <p style={{ color: '#888', fontSize: '0.75rem', fontWeight: '700', margin: 0 }}>SAVINGS ACCOUNT</p>
                          </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '900', margin: 0, letterSpacing: '2px' }}>159-1-37596-9</h2>
                            <button 
                              onClick={() => { navigator.clipboard.writeText('1591375969'); alert('คัดลอกเลขบัญชีแล้ว'); }}
                              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' }}
                            >
                              <FiCopy size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p style={{ color: '#444', fontSize: '0.7rem', fontWeight: '800', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Account Name</p>
                          <p style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: '800', margin: '5px 0 0' }}>วัชรพงศ์ เสือสง่า</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#444', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '25px' }}>ขั้นตอนการโอน</label>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                          { icon: <FiCreditCard />, text: 'โอนเงินเข้าบัญชีด้านบนตามยอดที่ต้องการ' },
                          { icon: <FiUploadCloud />, text: 'บันทึกรูปภาพสลิปการโอนเงิน (Receipt)' },
                          { icon: <FiBriefcase />, text: 'กรอกจำนวนเงินและแนบรูปในแบบฟอร์ม' },
                          { icon: <FiCheckCircle />, text: 'กดส่งข้อมูลและรอแอดมินยืนยันรายการ' },
                        ].map((step, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.1rem' }}>
                              {step.icon}
                            </div>
                            <p style={{ color: '#888', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
                              <span style={{ color: '#fff', marginRight: '8px' }}>{idx + 1}.</span> {step.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          ) : activeTab === 'withdraw' ? (
            <motion.div key="withdraw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass glass-panel wallet-form-container" style={{ borderRadius: '50px', border: '1px solid rgba(255,255,255,0.03)' }}>
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
                          style={{ width: '100%', padding: '18px 18px 18px 55px', borderRadius: '25px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '1.4rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }}><CoinIcon size={28} /></div>
                      </div>
                      {wAmount > 0 && (
                        <div style={{ marginTop: '12px', color: '#f59e0b', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FiCheckCircle /> ≈ ฿{(Number(wAmount) / 10).toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(10 Coins = ฿1)</span>
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
                      style={{ width: '100%', padding: '18px', borderRadius: '25px', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', opacity: wLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    >
                      {wLoading ? 'กำลังส่งคำขอ...' : <><FiSend /> ยืนยันการถอนเหรียญ</>}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'gas' ? (
            <motion.div key="gas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass glass-panel wallet-form-container" style={{ borderRadius: '50px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', marginBottom: '20px', letterSpacing: '1px' }}>
                    เติมพลังงาน Gas ให้เต็มถัง!
                  </h3>
                  <div style={{ width: '150px', height: '150px', marginBottom: '30px' }}>
                    <GasIcon gas={selectedGasPercent} size="100%" />
                  </div>
                  <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', marginBottom: '25px', maxWidth: '400px' }}>
                    เลือกจำนวนพลังงานที่คุณต้องการเติม
                  </p>

                  {/* Percentage Selector */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '35px', width: '100%', maxWidth: '400px' }}>
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedGasPercent(p)}
                        style={{
                          flex: 1, padding: '15px 5px', borderRadius: '15px', 
                          background: selectedGasPercent === p ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.02)',
                          color: selectedGasPercent === p ? '#10b981' : '#666',
                          border: selectedGasPercent === p ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
                          fontSize: '0.9rem', fontWeight: '800', cursor: 'pointer', transition: '0.3s'
                        }}
                      >
                        {p}%
                        <div style={{ fontSize: '0.6rem', marginTop: '4px', opacity: 0.7 }}>{p * 10} C</div>
                      </button>
                    ))}
                  </div>

                  <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '40px' }}>
                    *Gas จำเป็นสำหรับการรับงานใหม่ๆ
                  </p>

                  {gasErrorMsg && (
                    <div style={{ padding: '15px 25px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '25px', fontSize: '0.85rem', fontWeight: '700' }}>
                      {gasErrorMsg}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(16,185,129,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefillGas}
                    disabled={gasLoading || balance < (selectedGasPercent * 10)}
                    style={{ width: '100%', maxWidth: '350px', padding: '18px', borderRadius: '25px', background: '#10b981', color: '#000', border: 'none', fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer', opacity: (gasLoading || balance < (selectedGasPercent * 10)) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                  >
                    {gasLoading ? 'กำลังดำเนินการ...' : <><FiZap /> ยืนยันการเติม Gas ({(selectedGasPercent * 10).toLocaleString()} Coins)</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* 📡 Side Drawer: Financial History */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000 }}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="wallet-history-drawer"
              style={{ 
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '500px', 
                background: '#050505', borderLeft: '1px solid rgba(255,255,255,0.05)', 
                zIndex: 1001, overflowY: 'auto' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#fff' }}>ประวัติการเงิน</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                  <FiPlusCircle style={{ transform: 'rotate(45deg)' }} size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {transactions.length === 0 ? (
                  <div style={{ padding: '80px 20px', textAlign: 'center', color: '#333', fontWeight: '700', letterSpacing: '2px' }}>
                    ยังไม่มีประวัติการทำรายการ
                  </div>
                ) : (
                  transactions.map((tx, idx) => (
                    <motion.div
                      key={tx._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '25px', borderRadius: '25px', background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.03)' 
                      }}
                    >
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ 
                          width: '12px', height: '12px', borderRadius: '50%', 
                          background: tx.type === 'TOPUP' ? 'var(--accent)' : '#6366f1', 
                          boxShadow: `0 0 15px ${tx.type === 'TOPUP' ? 'var(--accent-glow)' : 'rgba(99,102,241,0.5)'}` 
                        }} />
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                            {({ TOPUP: 'เติมเหรียญ', PAY_JOB: 'จ่ายค่าบริการ', EARN_JOB: 'รายได้จากงาน', WITHDRAW: 'ถอนเงิน', REFUND: 'คืนเงิน' })[tx.type] || tx.type}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#444', fontWeight: '700', marginTop: '4px' }}>
                            {new Date(tx.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <CoinTag amount={tx.amount} positive={['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type)} />
                        <div style={{ fontSize: '0.6rem', color: '#222', fontWeight: '800', marginTop: '5px' }}>{tx.status}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🚨 SECURITY ANOMALY MODAL [NEO-CYBER RED ALERT] */}
      <AnimatePresence>
        {anomaly && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass anomaly-modal"
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
              className="glass success-modal"
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

              <h2 className="success-title" style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', marginBottom: '10px', letterSpacing: '-1px' }}>
                {showSuccess.type === 'gas' ? 'เติม Gas สำเร็จ!' : (showSuccess.isWithdraw ? 'คำขอถอนเงินส่งแล้ว!' : (showSuccess.isManual ? 'ส่งหลักฐานสำเร็จ!' : 'ทำรายการสำเร็จ!'))}
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#888', fontWeight: '500', marginBottom: '35px' }}>
                {showSuccess.type === 'gas' ? 'ปริมาณ Gas ของคุณกลับมาเต็มถัง (100%) แล้ว' : (showSuccess.isWithdraw ? 'ทีมงานกำลังตรวจสอบข้อมูลของคุณ' : (showSuccess.isManual ? 'กรุณารอแอดมินตรวจสอบสลิปและส่งเหรียญให้คุณ' : 'ระบบดำเนินการเรียบร้อยแล้ว'))}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '45px' }}>
                <div style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>
                  {showSuccess.type === 'gas' ? 'GAS ENERGY' : (showSuccess.isWithdraw ? 'WITHDRAWAL AMOUNT' : 'COINS CREDITED')}
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                  {showSuccess.type === 'gas' ? (
                    <>
                      <div style={{ width: '40px', height: '40px' }}><GasIcon gas={100} size="100%" /></div>
                      100%
                    </>
                  ) : (
                    <>
                      <CoinIcon size={40} />
                      {showSuccess.coins.toLocaleString()}
                    </>
                  )}
                </div>
                {showSuccess.type !== 'gas' && (
                  <div style={{ fontSize: '0.9rem', color: '#444', fontWeight: '700', marginTop: '10px' }}>
                    ≈ ฿{showSuccess.amount.toLocaleString()} THB
                  </div>
                )}
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
        .wallet-main-container,
        .wallet-main-container * {
          box-sizing: border-box;
        }

        .wallet-main-container {
          display: flex;
          flex-direction: column;
          gap: clamp(20px, 4vw, 40px);
          padding-bottom: clamp(40px, 8vw, 100px);
          width: 100% !important;
          max-width: 100%;
          margin: 0 auto;
          overflow-x: hidden;
        }

        .wallet-title {
          font-size: clamp(1.8rem, 8vw, 3rem);
          letter-spacing: -1px;
          line-height: 1.1;
          width: 100%;
          overflow-wrap: break-word;
        }

        .wallet-subtitle {
          font-size: clamp(0.85rem, 2vw, 1rem);
          max-width: 100%;
          overflow-wrap: break-word;
          word-wrap: break-word;
          color: #666;
          opacity: 0.8;
        }

        .wallet-top-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(10px, 2vw, 20px);
          margin-bottom: clamp(15px, 4vw, 40px);
          width: 100%;
        }

        .balance-card {
          padding: clamp(15px, 3vw, 30px);
          gap: clamp(10px, 2vw, 20px);
          width: 100%;
          min-width: 0;
        }

        .wallet-tabs-container {
          gap: clamp(10px, 3vw, 25px);
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 5px;
        }

        .topup-form-grid,
        .wallet-withdraw-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 0;
          width: 100%;
          overflow: hidden;
        }

        .topup-form-left, 
        .topup-form-right,
        .wallet-form-container {
          padding: clamp(15px, 4vw, 40px);
          width: 100%;
          min-width: 0;
        }

        .topup-form-right {
          gap: clamp(15px, 3vw, 40px);
        }

        .bank-card-visual {
          padding: clamp(12px, 3vw, 25px);
          max-width: 100%;
          width: 100%;
        }

        .wallet-history-drawer {
          padding: clamp(15px, 4vw, 30px);
          max-width: 100%;
        }

        /* 🕵️ Helper to hide Navbar icons from specific pages/drawers */
        .hide-navbar-icons .desktop-top-actions,
        .hide-navbar-icons .m-coin {
          display: none !important;
        }

        /* ── RESPONSIVE BREAKPOINTS ── */
        @media (max-width: 1300px) {
          .wallet-top-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 1100px) {
          .wallet-header-flex {
            flex-direction: column !important;
            gap: 15px !important;
          }

          .topup-form-grid,
          .wallet-withdraw-grid {
            grid-template-columns: 1fr !important;
          }
          
          .topup-form-grid > div,
          .wallet-withdraw-grid > div {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.03);
          }
        }

        @media (max-width: 950px) {
          .wallet-top-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .transaction-item {
             padding: 12px !important;
             flex-direction: column;
             align-items: flex-start !important;
             gap: 8px;
          }

          .transaction-meta {
             width: 100%;
             text-align: left !important;
             align-items: flex-start !important;
          }

          .wallet-form-container {
            border-radius: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .wallet-title { font-size: 1.8rem; }
          
          .glass-panel-new {
            border-radius: 15px !important;
          }

          .bank-card-visual {
            transform: scale(0.95);
            transform-origin: center center;
            margin: 0 auto;
          }

          .coin-conversion-box {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .upload-label {
            padding: 25px 12px !important;
            border-radius: 12px !important;
          }

          .wallet-tabs-container button {
            font-size: 0.75rem !important;
            letter-spacing: 0.5px !important;
          }
        }

        @media (max-width: 380px) {
          .wallet-title { font-size: 1.6rem; }
          
          .bank-card-visual {
            transform: scale(0.9);
          }

          /* Small scale for the modals */
          .success-modal, .anomaly-modal {
            padding: 20px 12px !important;
            border-radius: 15px !important;
          }
          
          .success-title { font-size: 1.3rem !important; }

          .balance-card h2 {
            font-size: 1.3rem !important;
          }
          
          .coin-badge-amount {
            font-size: 1.3rem !important;
          }
        }

        @media (max-width: 360px) {
          .wallet-main-container {
            padding-left: 5px;
            padding-right: 5px;
          }
          
          .wallet-subtitle {
            font-size: 0.75rem;
          }

          .wallet-tabs-container button {
            padding: 10px 4px !important;
            font-size: 0.65rem !important;
          }

          .topup-form-left, 
          .topup-form-right,
          .wallet-form-container {
            padding: 12px 8px !important;
          }

          input {
            font-size: 1rem !important;
            padding: 10px !important;
          }
          
          .coin-conversion-box input {
            padding-left: 35px !important;
          }

          .bank-card-visual {
            transform: scale(0.85);
          }
        }
      `}</style>
    </motion.div>
  );
}

export default ManageWallet;
