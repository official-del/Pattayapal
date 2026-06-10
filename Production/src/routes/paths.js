/** ใช้ import จากไฟล์นี้แทนการพิมพ์ path เองทุกที่ */
export const PATHS = {
  home: '/',
  services: '/services',
  works: '/works',
  work: (id) => `/works/${id}`,
  post: (id) => `/posts/${id}`,
  rankings: '/rankings',
  rankingsRoles: '/rankings/roles',
  discovery: '/freelancers',
  profile: (id) => `/profile/${id}`,
  username: (name) => `/${name}`,
  friends: '/friends',
  messenger: '/messenger',
  chat: (id) => `/messenger/${id}`,
  notifications: '/notifications',
  login: '/login',
  dashboard: '/dashboard',
  dashboardHiring: '/dashboard/hiring',
  dashboardWorks: '/dashboard/works',
  dashboardWallet: '/dashboard/wallet',
  dashboardQuests: '/dashboard/quests',
  jobs: '/jobs',
  managePortfolio: '/manage-portfolio',
  uploadWork: '/upload-work',
  editWork: (id) => `/edit-work/${id}`,
  terms: '/terms',
  privacy: '/privacy',
  adminLogin: '/admin/login',
  adminDashboard: '/admin/dashboard',
};

/** หน้าที่ต้องล็อกอินก่อน — ที่เหลือเปิดได้เลย */
const AUTH_PREFIXES = [
  '/friends',
  '/messenger',
  '/notifications',
  '/dashboard',
  '/jobs',
  '/manage-portfolio',
  '/upload-work',
  '/edit-work',
];

export function requiresAuth(pathname) {
  if (pathname.startsWith('/admin')) {
    return pathname !== PATHS.adminLogin && !pathname.startsWith(`${PATHS.adminLogin}/`);
  }
  if (pathname === PATHS.rankings) return true;
  return AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getLoginPath(pathname) {
  return pathname.startsWith('/admin') ? PATHS.adminLogin : PATHS.login;
}

/** หน้า login / กฎหมาย — ซ่อน Navbar */
export function isAuthFlowPage(pathname) {
  return [
    PATHS.login,
    '/auth',
    '/verify-email',
    PATHS.adminLogin,
    PATHS.terms,
    PATHS.privacy,
  ].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function shouldShowNavbar(pathname, hasToken) {
  if (pathname.startsWith('/admin')) return false;
  if (isAuthFlowPage(pathname)) return false;
  if (pathname === PATHS.rankings) return false;
  return !!hasToken;
}
