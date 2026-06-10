import { motion } from 'framer-motion';
import { FiArrowLeft, FiDatabase, FiEye, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import '../../css/LegalPages.css';

const privacySections = [
  {
    icon: FiDatabase,
    title: 'Information collection',
    body: 'We collect information you provide when creating an account, updating a profile, uploading works, posting jobs, or using wallet and marketplace features.',
  },
  {
    icon: FiLock,
    title: 'Data security',
    body: 'We use platform safeguards to protect account data, wallet records, and creator content. No online system is perfect, so users should keep credentials private.',
  },
  {
    icon: FiEye,
    title: 'Cookies and usage signals',
    body: 'PattayaPal may use cookies and usage data to remember preferences, improve discovery, keep sessions active, and understand how the product is used.',
  },
];

function Privacy() {
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
              <FiEye />
              <span>Data protection</span>
            </div>
            <h1>Privacy Policy</h1>
            <p>Last updated: April 20, 2026</p>
          </motion.header>

          <motion.div
            className="legal-content"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {privacySections.map((section, index) => {
              const Icon = section.icon;

              return (
                <section className="legal-section" key={section.title}>
                  <div className="legal-section-index">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <h2>
                      <Icon />
                      <span>{section.title}</span>
                    </h2>
                    <p>{section.body}</p>
                  </div>
                </section>
              );
            })}
          </motion.div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export default Privacy;
