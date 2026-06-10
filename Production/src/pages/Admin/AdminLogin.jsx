import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiLock, FiMail, FiShield } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import PremiumLoader from '../../components/PremiumLoader';
import '../../css/AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-label="Admin login">
        <div className="admin-login-brand">
          <div className="admin-login-mark">
            <FiShield />
          </div>
          <p>Admin Console</p>
          <h1>PattayaPal Control Room</h1>
          <span>Secure access for platform operations, creator records, content, wallet, and payout review.</span>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}

          <label>
            <span>Email address</span>
            <div className="admin-login-input">
              <FiMail />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@pattayapal.com"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="admin-login-input">
              <FiLock />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </label>

          <button type="submit" disabled={loading} className="admin-login-submit">
            {loading ? (
              <PremiumLoader bare size="tiny" />
            ) : (
              <>
                <span>Sign in</span>
                <FiArrowRight />
              </>
            )}
          </button>

          <p className="admin-login-note">Use an admin account created in PattayaPal system only.</p>
        </form>
      </section>
    </main>
  );
}
