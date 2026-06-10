import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiInfo, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import '../../css/LegalPages.css';

const termsSections = [
  {
    title: 'Overview',
    body: 'PattayaPal is a community hub and marketplace for creators, freelancers, and clients. By using the platform, you agree to follow these terms and use the service responsibly.',
  },
  {
    title: 'User accounts',
    body: 'You are responsible for keeping your account credentials secure and for the activity that happens under your account. Notify us if you believe your access has been compromised.',
  },
  {
    title: 'Content ownership',
    body: 'Creators retain ownership of uploaded works. By publishing content on PattayaPal, you allow the platform to display it inside relevant community, portfolio, and discovery surfaces.',
  },
  {
    title: 'Payments and transactions',
    body: 'Wallet activity, job payments, escrow records, and withdrawals may be reviewed for platform safety. Withdrawals are processed after verification and may take several business days.',
  },
];

function Terms() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <main className="legal-shell">
        <article className="legal-container">
          <button type="button" className="legal-back" onClick={goBack}>
            <FiArrowLeft />
            <span>Back</span>
          </button>

          <motion.header
            className="legal-hero"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="legal-badge">
              <FiShield />
              <span>Legal protocol</span>
            </div>
            <h1>Terms of Service</h1>
            <p>Last updated: April 20, 2026</p>
          </motion.header>

          <motion.div
            className="legal-content"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {termsSections.map((section, index) => (
              <section className="legal-section" key={section.title}>
                <div className="legal-section-index">{String(index + 1).padStart(2, '0')}</div>
                <div>
                  <h2>
                    <FiCheckCircle />
                    <span>{section.title}</span>
                  </h2>
                  <p>{section.body}</p>
                </div>
              </section>
            ))}

            <aside className="legal-note">
              <FiInfo />
              <p>
                <strong>Notice:</strong> These terms may be updated when the platform changes. Continuing to use PattayaPal means you accept the latest version.
              </p>
            </aside>
          </motion.div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export default Terms;
