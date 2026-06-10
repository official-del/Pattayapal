import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowUp,
  FiBriefcase,
  FiFacebook,
  FiGrid,
  FiInstagram,
  FiSearch,
  FiShield,
  FiTwitter,
  FiYoutube,
  FiZap,
} from 'react-icons/fi';
import logo from '../assets/LOGO1.png';
import { PATHS } from '../routes/paths';
import '../css/Footer.css';

const linkGroups = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Find Freelancers', path: PATHS.discovery },
      { label: 'User Creations', path: PATHS.works },
      { label: 'Services', path: PATHS.services },
      { label: 'Rankings Hub', path: PATHS.rankings },
    ],
  },
  {
    title: 'Creator Tools',
    links: [
      { label: 'Creator Hub', path: PATHS.dashboard },
      { label: 'Manage Portfolio', path: PATHS.managePortfolio },
      { label: 'Upload Work', path: PATHS.uploadWork },
      { label: 'Daily Quests', path: PATHS.dashboardQuests },
    ],
  },
  {
    title: 'Workspace',
    links: [
      { label: 'Messenger', path: PATHS.messenger },
      { label: 'Friends', path: PATHS.friends },
      { label: 'Manage Jobs', path: PATHS.jobs },
      { label: 'Wallet System', path: PATHS.dashboardWallet },
    ],
  },
];

const quickActions = [
  { label: 'Browse Creators', path: PATHS.discovery, icon: <FiSearch /> },
  { label: 'Post a Job', path: PATHS.dashboardHiring, icon: <FiBriefcase /> },
  { label: 'Explore Works', path: PATHS.works, icon: <FiGrid /> },
];

const socialLinks = [
  { label: 'Facebook', icon: <FiFacebook />, href: '#' },
  { label: 'Instagram', icon: <FiInstagram />, href: '#' },
  { label: 'X', icon: <FiTwitter />, href: '#' },
  { label: 'YouTube', icon: <FiYoutube />, href: '#' },
];

function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="pp-footer">
      <div className="pp-footer-shell">
        <motion.button
          type="button"
          className="pp-footer-top"
          onClick={scrollToTop}
          whileHover={{ y: -2 }}
          whileTap={{ y: 1 }}
          aria-label="Back to top"
        >
          <FiArrowUp />
        </motion.button>

        <section className="pp-footer-hero" aria-label="PattayaPal footer overview">
          <div className="pp-footer-brand">
            <Link to={PATHS.home} className="pp-footer-logo" aria-label="PattayaPal home">
              <img src={logo} alt="" />
              <span>
                Pattaya<span>Pal</span>
              </span>
            </Link>
            <span className="pp-footer-kicker"><FiZap /> Pixel Creator Marketplace</span>
            <p>
              Community hub for creators, freelancers, and clients to discover work, hire talent,
              manage jobs, and build reputation inside PattayaPal.
            </p>
            <div className="pp-footer-socials" aria-label="Social links">
              {socialLinks.map((item) => (
                <a key={item.label} href={item.href} aria-label={item.label}>
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="pp-footer-right-col">


            <div className="pp-footer-actions" aria-label="Quick actions">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.path} className="pp-footer-action">
                  <span>{action.icon}</span>
                  <strong>{action.label}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pp-footer-links" aria-label="Footer navigation">
          {linkGroups.map((group) => (
            <nav key={group.title} className="pp-footer-column" aria-label={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="pp-footer-status">
            <span className="pp-footer-kicker"><FiShield /> Platform Status</span>
            <strong>Creator economy online</strong>
            <p>Escrow, coin balance, ranks, and portfolio discovery stay connected across the app.</p>
          </div>
        </section>

        <div className="pp-footer-base">
          <p>&copy; {new Date().getFullYear()} PattayaPal Community. All rights reserved.</p>
          <div>
            <Link to={PATHS.privacy}>Privacy Policy</Link>
            <Link to={PATHS.terms}>Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
