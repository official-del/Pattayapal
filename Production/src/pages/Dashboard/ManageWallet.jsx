import { useState, useEffect, useContext } from 'react';
import { walletAPI, usersAPI } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiCheckCircle,
  FiChevronDown,
  FiCopy,
  FiCreditCard,
  FiInfo,
  FiList,
  FiPlusCircle,
  FiSend,
  FiShield,
  FiUploadCloud,
  FiZap,
} from 'react-icons/fi';
import { CoinIcon, CoinBadge, CoinTag } from '../../components/CoinIcon';
import GasIcon from '../../components/GasIcon';
import kbankLogo from '../../assets/kasikorn-logo.jpg';
import '../../css/ManageWallet.css';

const THAI_BANKS = [
  { id: 'kbank', name: 'Kasikornbank (K-Bank)', color: '#138B2E' },
  { id: 'scb', name: 'Siam Commercial Bank (SCB)', color: '#4E2E7F' },
  { id: 'bbl', name: 'Bangkok Bank (BBL)', color: '#1E4598' },
  { id: 'ktb', name: 'Krungthai Bank (KTB)', color: '#00A1E0' },
  { id: 'bay', name: 'Krungsri (BAY)', color: '#FFD400' },
  { id: 'gsb', name: 'Government Savings Bank (GSB)', color: '#EB008B' },
  { id: 'ttb', name: 'TTB Bank', color: '#002D63' },
  { id: 'baac', name: 'BAAC', color: '#00A950' },
  { id: 'other', name: 'Other bank', color: '#666666' },
];

const TX_LABELS = {
  TOPUP: 'Coin top-up',
  PAY_JOB: 'Job payment',
  EARN_JOB: 'Job earning',
  WITHDRAW: 'Withdraw request',
  REFUND: 'Refund',
  GAS_REFILL: 'Gas refill',
};

function ManageWallet() {
  const { user, token: contextToken, fetchProfile } = useContext(AuthContext);
  const currentToken = contextToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
  const userInfoRaw = user || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
  const { socket } = useSocket();

  const coinBal = userInfoRaw?.coinBalance ?? userInfoRaw?.balance ?? userInfoRaw?.coins ?? 0;
  const gasBal = userInfoRaw?.gasBalance ?? userInfoRaw?.gas ?? 0;
  const [balance, setBalance] = useState(coinBal);
  const [gasBalance, setGasBalance] = useState(gasBal);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('topup');

  const [amount, setAmount] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [anomaly, setAnomaly] = useState(null);
  const [showSuccess, setShowSuccess] = useState(null);

  const [wAmount, setWAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState(userInfoRaw?.bankAccount?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(userInfoRaw?.bankAccount?.accountNumber || '');
  const [wLoading, setWLoading] = useState(false);
  const [wStatusMsg, setWStatusMsg] = useState({ text: '', isSuccess: false });
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [gasLoading, setGasLoading] = useState(false);
  const [gasErrorMsg, setGasErrorMsg] = useState('');
  const [selectedGasPercent, setSelectedGasPercent] = useState(100);

  const [summaryData, setSummaryData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchTransactions = async () => {
    if (!currentToken) return;
    try {
      const data = await walletAPI.getTransactions(currentToken);
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentToken) return;

    fetchTransactions();
    if (fetchProfile) fetchProfile();

    const fetchSummary = async () => {
      try {
        const data = await usersAPI.getDashboardSummary(currentToken);
        setSummaryData(data);
      } catch (e) {
        console.error('Summary Fetch Error:', e);
      }
    };
    fetchSummary();
  }, [currentToken]);

  useEffect(() => {
    if (transactions.length > 0 && balance === 0) {
      const calculated = transactions.reduce((acc, tx) => {
        const amt = Number(tx.amount) || 0;
        const isPositive = ['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type);
        const isNegative = ['PAY_JOB', 'WITHDRAW'].includes(tx.type);
        return isPositive ? acc + amt : (isNegative ? acc - amt : acc);
      }, 0);
      if (calculated > 0) setBalance(calculated);
    }
  }, [transactions, balance]);

  useEffect(() => {
    if (user?.coinBalance !== undefined) setBalance(user.coinBalance);
    if (user?.gasBalance !== undefined) setGasBalance(user.gasBalance);
    else if (user?.gas !== undefined) setGasBalance(user.gas);
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleBalanceUpdate = (data) => {
      if (data.coinBalance !== undefined) {
        setBalance(data.coinBalance);
        fetchTransactions();
        if (fetchProfile) fetchProfile();
      }
      if (data.gasBalance !== undefined) {
        setGasBalance(data.gasBalance);
        if (fetchProfile) fetchProfile();
      } else if (data.gas !== undefined) {
        setGasBalance(data.gas);
        if (fetchProfile) fetchProfile();
      }
    };

    socket.on('balance_update', handleBalanceUpdate);
    return () => socket.off('balance_update', handleBalanceUpdate);
  }, [socket, fetchProfile]);

  useEffect(() => {
    if (showHistory) document.body.classList.add('hide-navbar-icons');
    else document.body.classList.remove('hide-navbar-icons');
    return () => document.body.classList.remove('hide-navbar-icons');
  }, [showHistory]);

  const handleTopup = async (e) => {
    if (e) e.preventDefault();
    if (!amount || amount <= 0 || !slipFile) return;

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
        type: 'topup',
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to submit the payment receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    if (e) e.preventDefault();
    const numAmount = Number(wAmount);
    if (!numAmount || numAmount <= 0) return;
    if (!bankName || !accountName || !accountNumber) {
      setWStatusMsg({ text: 'Please complete the bank account details.', isSuccess: false });
      return;
    }
    if (numAmount > balance) {
      setWStatusMsg({ text: 'Insufficient coin balance.', isSuccess: false });
      return;
    }

    setWLoading(true);
    setWStatusMsg({ text: '', isSuccess: false });
    try {
      await walletAPI.requestWithdraw({ amount: numAmount, bankName, accountName, accountNumber }, currentToken);
      setWStatusMsg({ text: 'Withdraw request submitted. The team will verify it within 1-3 days.', isSuccess: true });
      setWAmount('');
      if (fetchProfile) fetchProfile();
      fetchTransactions();
      setShowSuccess({ isWithdraw: true, coins: numAmount, amount: numAmount / 10, type: 'withdraw' });
    } catch (err) {
      const data = err.response?.data;
      if (data?.status === 'ANOMALY') {
        setAnomaly({ code: data.code, message: data.message });
      } else {
        setWStatusMsg({ text: data?.message || 'Unable to submit withdraw request.', isSuccess: false });
      }
    } finally {
      setWLoading(false);
    }
  };

  const handleRefillGas = async (e, overridePercent = null) => {
    if (e?.preventDefault) e.preventDefault();
    const targetPercent = overridePercent || selectedGasPercent;
    const cost = targetPercent * 10;
    if (balance < cost) {
      setGasErrorMsg(`Insufficient coins. Required: ${cost.toLocaleString()} Coins`);
      return;
    }

    setGasLoading(true);
    setGasErrorMsg('');
    try {
      const res = await walletAPI.refillGas({ percent: targetPercent });
      setGasBalance(res.gasBalance);
      if (fetchProfile) fetchProfile();
      fetchTransactions();
      setShowSuccess({ isGas: true, coins: cost, amount: targetPercent, type: 'gas' });
    } catch (err) {
      setGasErrorMsg(err.response?.data?.message || 'Unable to refill gas.');
    } finally {
      setGasLoading(false);
    }
  };

  const pendingTopups = transactions.filter((t) => t.status === 'pending' && t.type === 'TOPUP');
  const totalEarned = summaryData?.totalEarnings || transactions
    .filter((tx) => tx.type === 'EARN_JOB')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  return (
    <motion.div
      className="wallet-main-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="wallet-hero">
        <div className="wallet-hero-copy">
          <div className="wallet-kicker"><FiZap size={16} /><span>Wallet System</span></div>
          <h1>My Coin Vault</h1>
          <p>Manage coins, refill gas, upload payment receipts, and track every wallet movement from one command surface.</p>
        </div>
        <button type="button" className="wallet-history-btn" onClick={() => setShowHistory(true)} aria-label="Open transaction history">
          <FiList size={20} />
          <span>History</span>
        </button>
      </header>

      <section className="wallet-balance-grid" aria-label="Wallet balances">
        <motion.article whileHover={{ y: -2 }} className="wallet-stat-card is-coin">
          <div className="wallet-stat-icon"><CoinIcon size={34} /></div>
          <div>
            <span>Available coins</span>
            <strong>{Number(balance).toLocaleString('th-TH')}</strong>
          </div>
        </motion.article>

        <motion.article whileHover={{ y: -2 }} className={`wallet-stat-card is-gas ${gasBalance <= 20 ? 'is-critical' : ''}`}>
          <div className="wallet-stat-icon"><GasIcon gas={gasBalance} size="100%" /></div>
          <div>
            <span>{gasBalance <= 20 ? 'Critical energy' : 'Gas energy'}</span>
            <strong>{gasBalance}<small>%</small></strong>
          </div>
          {gasBalance < 100 && (
            <button
              type="button"
              className="wallet-mini-action"
              onClick={(e) => { e.stopPropagation(); handleRefillGas(null, 100); }}
              disabled={gasLoading || balance < 1000}
            >
              <FiZap size={14} /> Refill
            </button>
          )}
        </motion.article>

        <motion.article whileHover={{ y: -2 }} className="wallet-stat-card is-withdraw" onClick={() => setActiveTab('withdraw')}>
          <div className="wallet-stat-icon"><FiShield size={24} /></div>
          <div>
            <span>Total earned</span>
            <strong>{Number(totalEarned).toLocaleString('th-TH')}</strong>
          </div>
        </motion.article>
      </section>

      <nav className="wallet-tabs" aria-label="Wallet actions">
        {[
          { id: 'topup', label: 'Recharge', icon: <FiPlusCircle /> },
          { id: 'withdraw', label: 'Cash out', icon: <FiCreditCard /> },
          { id: 'gas', label: 'Refill gas', icon: <FiZap /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'is-active' : ''}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'topup' && (
          <motion.section key="topup" className="wallet-panel wallet-topup-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="wallet-form-column">
              <div className="wallet-panel-heading">
                <div className="wallet-section-icon"><FiPlusCircle size={22} /></div>
                <div>
                  <h2>Recharge by receipt</h2>
                  <p>Transfer THB, upload the payment receipt, and wait for admin verification.</p>
                </div>
              </div>

              <div className="wallet-conversion-grid">
                <label className="wallet-field">
                  <span>Transfer amount (THB)</span>
                  <div className="wallet-input-wrap">
                    <b>฿</b>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  </div>
                </label>
                <div className="wallet-conversion-card">
                  <span>You will receive</span>
                  <strong>{(Number(amount || 0) * 10).toLocaleString()} <small>Coins</small></strong>
                </div>
              </div>

              <label className={`wallet-upload ${slipFile ? 'has-file' : ''}`}>
                <input type="file" accept="image/*" hidden onChange={(e) => setSlipFile(e.target.files[0])} />
                {slipFile ? (
                  <>
                    <FiCheckCircle size={34} />
                    <strong>{slipFile.name}</strong>
                    <span>Receipt attached. Click to replace it.</span>
                  </>
                ) : (
                  <>
                    <FiUploadCloud size={34} />
                    <strong>Upload payment receipt</strong>
                    <span>JPG or PNG image files are supported.</span>
                  </>
                )}
              </label>

              {errorMsg && <div className="wallet-alert is-error"><FiInfo size={18} /> {errorMsg}</div>}

              <button type="button" className="wallet-primary-btn" onClick={handleTopup} disabled={loading || !amount || !slipFile}>
                {loading ? 'Processing...' : <><FiSend /> Submit receipt</>}
              </button>
            </div>

            <aside className="wallet-bank-column">
              <div className="wallet-bank-card">
                <div className="wallet-bank-top">
                  <img src={kbankLogo} alt="Kasikornbank" />
                  <span>Kasikornbank</span>
                </div>
                <div className="wallet-account-number">
                  <strong>159-1-37596-9</strong>
                  <button type="button" onClick={() => navigator.clipboard.writeText('1591375969')} aria-label="Copy bank account number">
                    <FiCopy size={16} />
                  </button>
                </div>
                <span className="wallet-bank-label">Account name</span>
                <p>Watcharapong Suea-sanga</p>
              </div>

              <div className="wallet-steps">
                <span className="wallet-bank-label">Transfer checklist</span>
                {[
                  'Transfer to the account above.',
                  'Save your payment receipt image.',
                  'Enter amount and attach the receipt.',
                  'Submit and wait for admin verification.',
                ].map((step, idx) => (
                  <div key={step} className="wallet-step">
                    <span>{idx + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </aside>
          </motion.section>
        )}

        {activeTab === 'withdraw' && (
          <motion.section key="withdraw" className="wallet-panel wallet-withdraw-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="wallet-form-column">
              <div className="wallet-panel-heading">
                <div className="wallet-section-icon"><FiCreditCard size={22} /></div>
                <div>
                  <h2>Cash out coins</h2>
                  <p>Submit your target bank account and the amount of coins you want to withdraw.</p>
                </div>
              </div>

              <label className="wallet-field">
                <span>Withdraw coins</span>
                <div className="wallet-input-wrap">
                  <CoinIcon size={26} />
                  <input type="number" min="1" max={balance} value={wAmount} onChange={(e) => setWAmount(e.target.value)} placeholder="0" />
                </div>
              </label>
              {wAmount > 0 && <div className="wallet-rate-note">Estimated payout: ฿{(Number(wAmount) / 10).toLocaleString()}</div>}

              <div className="wallet-bank-select">
                <span>Destination bank</span>
                <button type="button" onClick={() => setShowBankDropdown(!showBankDropdown)}>
                  <span>{bankName || 'Select bank account'}</span>
                  <FiChevronDown className={showBankDropdown ? 'is-open' : ''} />
                </button>
                <AnimatePresence>
                  {showBankDropdown && (
                    <motion.div className="wallet-bank-menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                      {THAI_BANKS.map((bank) => (
                        <button key={bank.id} type="button" onClick={() => { setBankName(bank.name); setShowBankDropdown(false); }}>
                          <i style={{ background: bank.color }} />
                          {bank.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <aside className="wallet-form-column wallet-account-panel">
              <span className="wallet-bank-label">Receiving account</span>
              <label className="wallet-field">
                <span>Account name</span>
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Bank account name" />
              </label>
              <label className="wallet-field">
                <span>Account number</span>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="000-0-00000-0" />
              </label>

              {wStatusMsg.text && <div className={`wallet-alert ${wStatusMsg.isSuccess ? 'is-success' : 'is-error'}`}>{wStatusMsg.text}</div>}

              <button type="button" className="wallet-primary-btn" onClick={handleWithdraw} disabled={wLoading}>
                {wLoading ? 'Processing...' : 'Submit withdraw request'}
              </button>

              <div className="wallet-settlement">
                <span><FiShield size={15} /> Settlement protocol</span>
                <div>
                  {['Request', 'Verify', 'Settle'].map((step) => <p key={step}>{step}</p>)}
                </div>
                <small>Most requests settle within 24-48 hours after verification.</small>
              </div>
            </aside>
          </motion.section>
        )}

        {activeTab === 'gas' && (
          <motion.section key="gas" className="wallet-panel wallet-gas-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="wallet-gas-visual"><GasIcon gas={selectedGasPercent} size="100%" /></div>
            <div className="wallet-gas-copy">
              <div className="wallet-panel-heading">
                <div className="wallet-section-icon is-green"><FiZap size={22} /></div>
                <div>
                  <h2>Refill creator gas</h2>
                  <p>Spend coins to refill your action energy. Pick a refill level and confirm the transaction.</p>
                </div>
              </div>
              <div className="wallet-gas-options">
                {[25, 50, 75, 100].map((p) => (
                  <button key={p} type="button" className={selectedGasPercent === p ? 'is-active' : ''} onClick={() => setSelectedGasPercent(p)}>
                    {p}%
                  </button>
                ))}
              </div>
              {gasErrorMsg && <div className="wallet-alert is-error">{gasErrorMsg}</div>}
              <button type="button" className="wallet-primary-btn is-green" onClick={handleRefillGas} disabled={gasLoading || balance < selectedGasPercent * 10}>
                {gasLoading ? 'Processing...' : `Refill gas for ${(selectedGasPercent * 10).toLocaleString()} Coins`}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {pendingTopups.length > 0 && (
        <section className="wallet-pending">
          <div className="wallet-kicker"><FiActivity size={15} /><span>Pending verification</span></div>
          <div className="wallet-pending-list">
            {pendingTopups.map((t) => (
              <div key={t._id} className="wallet-pending-row">
                <CoinIcon size={24} />
                <div>
                  <strong>Recharge: {(t.amount * 10).toLocaleString()} Coins</strong>
                  <span>Receipt received, admin verification in progress. ฿{t.amount}</span>
                </div>
                <em>In review</em>
              </div>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div className="wallet-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHistory(false)} />
            <motion.aside className="wallet-history-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
              <div className="wallet-drawer-header">
                <div>
                  <span className="wallet-kicker">Ledger</span>
                  <h2>Transaction history</h2>
                </div>
                <button type="button" onClick={() => setShowHistory(false)}><FiPlusCircle size={22} /></button>
              </div>
              <div className="wallet-history-list">
                {transactions.length === 0 ? (
                  <div className="wallet-empty-history">No wallet transactions yet.</div>
                ) : transactions.map((tx, idx) => (
                  <motion.div key={tx._id} className="wallet-history-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.025 }}>
                    <div className="wallet-history-dot" />
                    <div>
                      <strong>{TX_LABELS[tx.type] || tx.type}</strong>
                      <span>{new Date(tx.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                    <div className="wallet-history-amount">
                      <CoinTag amount={tx.amount} positive={['TOPUP', 'EARN_JOB', 'REFUND'].includes(tx.type)} />
                      <small>{tx.status}</small>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {anomaly && (
          <div className="wallet-modal-layer">
            <motion.div className="wallet-modal is-danger" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}>
              <FiInfo size={42} />
              <h2>System anomaly detected</h2>
              <p>{anomaly.message}</p>
              <button type="button" onClick={() => setAnomaly(null)}>Acknowledge</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <div className="wallet-modal-layer">
            <motion.div className="wallet-modal is-success" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}>
              <FiCheckCircle size={48} />
              <h2>Transaction submitted</h2>
              <p>Your wallet action has been recorded successfully.</p>
              <button type="button" onClick={() => setShowSuccess(null)}>Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ManageWallet;
