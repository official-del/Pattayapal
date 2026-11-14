import { customConfirm } from '../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { usersAPI, chatAPI, worksAPI, postsAPI, uploadAPI } from '../utils/api';
import FeedPost from '../components/FeedPost';
import { getFullUrl, getMediaUrl, getWorkPosterUrl, getWorkVideoUrl, isVideoUrl, workIsVideo } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import HireModal from '../components/HireModal';
import ImageCropModal from '../components/ImageCropModal';
import HoverVideoPlayer from '../components/HoverVideoPlayer';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { useSocket } from '../context/SocketContext';
import { formatLastSeen, toLocalIsoStr } from '../utils/timeUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
   FiMessageSquare, FiUserPlus, FiUserCheck, FiUserX, FiBriefcase,
   FiCalendar, FiLayers, FiMessageCircle, FiUsers, FiClock, FiTrash2, FiEdit3, FiSave, FiCheck, FiX, FiShare2, FiPlus, FiVideo, FiMic, FiType, FiCamera, FiLayout, FiMaximize2, FiMinimize2, FiBox, FiActivity, FiZap, FiAward, FiCheckCircle,
   FiMapPin, FiMail, FiGlobe, FiPhone, FiStar, FiBookmark, FiUploadCloud, FiImage, FiLink
} from 'react-icons/fi';
import CustomSelect from '../components/CustomSelect';
import SharePackageModal from '../components/SharePackageModal';
import RankBadge from '../components/RankBadge';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';
import PremiumLoader from '../components/PremiumLoader';
import Footer from '../components/Footer';
import '../css/UserProfile.css';

import { CONFIG } from '../utils/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

export const PRODUCTION_SKILLS = [
   "Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Final Cut Pro", "Color Grading",
   "Video Editing", "Motion Graphics", "Cinematography", "Directing", "Scriptwriting",
   "Sound Design", "Audio Mixing", "Visual Effects (VFX)", "3D Animation", "Drone Pilot", "AI Media Producer",
   "Adobe Photoshop", "Adobe Lightroom", "Photography", "Studio Photography", "Portrait Photography",
   "Product Photography", "Event Photography", "Retouching",
   "Adobe Illustrator", "InDesign", "Graphic Design", "UI/UX Design", "Figma", "Canva",
   "Logo Design", "Branding", "Social Media Content", "Digital Artist", "Web Development", "2D Animation",
   "Blender", "Cinema 4D", "Unreal Engine", "Unity", "3ds Max", "Maya", "3D Modeling", "VFX",
   "Camera Operation", "Lighting Design", "Gaffer", "Grip", "Production Manager",
   "Live Streaming", "OBS Studio", "Technical Director", "Gimbal Operation", "Storyboard Artist",
   "Copywriting", "Content Marketing", "SEO", "Translation", "Voice Over", "Music Production",
   "AI Content Specialist"
];

export const SKILL_CATEGORIES = [
   "Video & Film", "Photography", "Design & Digital", "3D & Tech",
   "Production & Technical", "Marketing & Others", "General"
];



function UserProfile() {
   const { userId, username } = useParams();
   const navigate = useNavigate();
   const { user: contextUser, token: contextToken, fetchProfile: refreshContext, updateUser, profileUpdateTag } = useContext(AuthContext);

   const currentToken = contextToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
   const currentUser = contextUser || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');

   const currentUserId = String(currentUser?._id || currentUser?.id || "");
   const [targetProfileId, setTargetProfileId] = useState(userId || "");
   const isMyProfile = !!currentUserId && (currentUserId === targetProfileId);

   const [profile, setProfile] = useState(null);
   const [works, setWorks] = useState([]);
   const [recentComments, setRecentComments] = useState([]);
   const [friendStatus, setFriendStatus] = useState('none');
   const [loading, setLoading] = useState(true);
   const [worksLoading, setWorksLoading] = useState(true);
   const [friendLoading, setFriendLoading] = useState(false);
   const [editingProfile, setEditingProfile] = useState(false);
   const [bioText, setBioText] = useState('');
   const [nameText, setNameText] = useState('');
   const [professionText, setProfessionText] = useState('General');
   const [isAvailable, setIsAvailable] = useState(true);
   const [tagsText, setTagsText] = useState('');
   const [usernameText, setUsernameText] = useState('');
   const [phoneText, setPhoneText] = useState('');
   const [addressText, setAddressText] = useState('');
   const [birthdayText, setBirthdayText] = useState('');
   const [websiteText, setWebsiteText] = useState('');
   const [genderText, setGenderText] = useState('None');
   const [experience, setExperience] = useState([]);
   const [skills, setSkills] = useState([]);
   const [userPosts, setUserPosts] = useState([]);
   const [activeCommentPostId, setActiveCommentPostId] = useState(null);
   const handleToggleComments = (postId) => {
      setActiveCommentPostId(prev => (prev === postId ? null : postId));
   };


   const [servicePackages, setServicePackages] = useState([]);
   const [showPkgModal, setShowPkgModal] = useState(false);
   const [pkgEditingIndex, setPkgEditingIndex] = useState(null);
   const [pkgForm, setPkgForm] = useState({ title: '', price: '', deliveryTime: '', description: '', features: '', coverImages: [] });
   const [activeTab, setActiveTab] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'portfolio';
   });
   const [friendRequests, setFriendRequests] = useState([]);
   const [rankProgress, setRankProgress] = useState(null);
   const [showHireModal, setShowHireModal] = useState(false);
   const [selectedPackage, setSelectedPackage] = useState(null);
   const [sharePackage, setSharePackage] = useState(null);
   const [visibleWorks, setVisibleWorks] = useState(10); // 1 ผลงานเด่น + 9 ชิ้นในกริด (3 แถว x 3)
   const location = useLocation();

   const fileInputRef = useRef(null);
   const coverInputRef = useRef(null);
   const editIdentityButtonRef = useRef(null);
   const sharePackageButtonRefs = useRef([]);
   const [coverLoading, setCoverLoading] = useState(false);
   const [avatarLoading, setAvatarLoading] = useState(false);
   const [imageToCrop, setImageToCrop] = useState(null);
   const [cropConfig, setCropConfig] = useState({ aspect: 1, type: 'profile' });

   const { socket } = useSocket();
   const [isOnline, setIsOnline] = useState(false);
   const [lastSeen, setLastSeen] = useState(null);

   const openIdentityEditor = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      setEditingProfile(true);
   };

   const openPackageShare = (e, pkg) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      setSharePackage(pkg);
   };

   const handleProfileActionCapture = (e) => {
      const actionTarget = e.target.closest?.('[data-profile-action]');
      if (!actionTarget) return;

      const action = actionTarget.dataset.profileAction;
      if (action === 'edit-identity') {
         openIdentityEditor(e);
      }

      if (action === 'share-package') {
         const packageIndex = Number(actionTarget.dataset.packageIndex);
         const pkg = profile?.servicePackages?.[packageIndex];
         if (pkg) openPackageShare(e, pkg);
      }
   };

   const pointHitsElement = (event, element) => {
      if (!element || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return false;
      const rect = element.getBoundingClientRect();
      return (
         event.clientX >= rect.left &&
         event.clientX <= rect.right &&
         event.clientY >= rect.top &&
         event.clientY <= rect.bottom
      );
   };

   useEffect(() => {
      const handleNativeProfileAction = (event) => {
         if (editingProfile || sharePackage) return;

         if (isMyProfile && pointHitsElement(event, editIdentityButtonRef.current)) {
            openIdentityEditor(event);
            return;
         }

         const packageIndex = sharePackageButtonRefs.current.findIndex((button) => pointHitsElement(event, button));
         if (packageIndex >= 0) {
            const pkg = profile?.servicePackages?.[packageIndex];
            if (pkg) openPackageShare(event, pkg);
         }
      };

      document.addEventListener('pointerdown', handleNativeProfileAction, true);
      return () => document.removeEventListener('pointerdown', handleNativeProfileAction, true);
   }, [editingProfile, isMyProfile, profile?.servicePackages, sharePackage]);

   useEffect(() => {
      if (profile) {
         setIsOnline(profile.isOnline);
         setLastSeen(profile.lastSeen);
      }
   }, [profile]);

   useEffect(() => {
      if (!socket || !targetProfileId) return;
      const handleStatusChange = (data) => {
         if (data.userId === targetProfileId) {
            setIsOnline(data.isOnline);
            if (data.lastSeen) setLastSeen(data.lastSeen);
         }
      };

      const handleProfileUpdate = (data) => {
         if (data.userId === targetProfileId) {
            setProfile(prev => {
               if (!prev) return prev;
               return { ...prev, ...data };
            });
         }
      };

      const handleWorkUpdate = (data) => {
         if (!data || !data.work) return;
         const updatedWork = data.work;
         if (updatedWork.createdBy?._id === targetProfileId || updatedWork.createdBy === targetProfileId) {
            setWorks(prevWorks => {
               if (data.action === 'create') return [updatedWork, ...prevWorks];
               if (data.action === 'update') return prevWorks.map(w => w._id === updatedWork._id ? updatedWork : w);
               if (data.action === 'delete') return prevWorks.filter(w => w._id !== data.workId);
               return prevWorks;
            });
         } else if (data.action === 'delete') {
            setWorks(prevWorks => prevWorks.filter(w => w._id !== data.workId));
         }
      };

      if (socket) {
         socket.on('status_change', handleStatusChange);
         socket.on('profile_updated', handleProfileUpdate);
         socket.on('work_updated', handleWorkUpdate);

         return () => {
            socket.off('status_change', handleStatusChange);
            socket.off('profile_updated', handleProfileUpdate);
            socket.off('work_updated', handleWorkUpdate);
         };
      }
   }, [socket, targetProfileId]);

   useEffect(() => {
      const fetchData = async () => {
         const identifier = userId || username || currentUserId;
         if (!identifier) return;

         setLoading(true);
         try {
            let data;
            if (username) {
               try { data = await usersAPI.getPublicProfileByUsername(username); } catch (err) { data = await usersAPI.getPublicProfile(username); }
            } else {
               data = await usersAPI.getPublicProfile(identifier);
            }

            const fetchedUser = data.user;
            setProfile(fetchedUser);
            const activeProfileId = fetchedUser?._id ? String(fetchedUser._id) : targetProfileId;
            if (fetchedUser?._id) setTargetProfileId(activeProfileId);

            setRecentComments(data.recentComments || []);
            setBioText(data.user?.bio || '');
            setNameText(data.user?.name || '');
            setProfessionText(data.user?.profession || 'General');
            setIsAvailable(data.user?.isAvailableForHire ?? true);
            setTagsText((data.user?.serviceTags || []).join(', '));
            setUsernameText(data.user?.username || '');
            setPhoneText(data.user?.phone || '');
            setAddressText(data.user?.address || '');
            setBirthdayText(data.user?.birthday ? toLocalIsoStr(new Date(data.user.birthday)) : '');
            setGenderText(data.user?.gender || 'None');
            setExperience(data.user?.experience || []);
            setSkills(data.user?.skills || []);
            setServicePackages(data.user?.servicePackages || []);
            setWebsiteText(data.user?.website || '');

            const wRes = await worksAPI.getByUser(activeProfileId);
            setWorks(wRes.works || []);

            if (currentToken && !isMyProfile) {
               const statusRes = await usersAPI.getFriendStatus(activeProfileId, currentToken);
               setFriendStatus(statusRes.status);
            }

            if (currentToken && isMyProfile) {
               const rankRes = await axios.get(`${API_BASE_URL}/api/users/me/rank-progress`, { headers: { Authorization: `Bearer ${currentToken}` } });
               setRankProgress(rankRes.data);
               const reqs = await usersAPI.getMyFriendRequests(currentToken);
               setFriendRequests(reqs);
            }
            const postsRes = await postsAPI.getByUser(activeProfileId); const allPosts = Array.isArray(postsRes) ? postsRes : (postsRes?.posts || postsRes?.data || []); setUserPosts(allPosts);
         } catch (err) { /* quiet on profile error */ }
         finally { setLoading(false); setWorksLoading(false); }
      };
      fetchData();
      window.scrollTo(0, 0);
   }, [userId, username, currentUserId, currentToken]);

   const handleFriendAction = async () => {
      if (!currentToken) return toast.error('กรุณาเข้าสู่ระบบก่อนครับ');
      setFriendLoading(true);
      try {
         if (friendStatus === 'none') {
            await usersAPI.sendFriendRequest(targetProfileId, currentToken);
            setFriendStatus('pending_sent');
         } else if (friendStatus === 'pending_sent') {
            await usersAPI.cancelFriendRequest(targetProfileId, currentToken);
            setFriendStatus('none');
         } else if (friendStatus === 'pending_received') {
            await usersAPI.respondFriendRequest(targetProfileId, 'accept', currentToken);
            setFriendStatus('friends');
            setProfile(p => ({ ...p, friends: [...(p.friends || []), { _id: currentUser._id, name: currentUser.name }] }));
         } else if (friendStatus === 'friends') {
            if (!await customConfirm(`ยกเลิกเพื่อนกับ ${profile?.name}?`)) return;
            await usersAPI.removeFriend(targetProfileId, currentToken);
            setFriendStatus('none');
         }
      } catch { toast.error('Operation failed.'); }
      finally { setFriendLoading(false); }
   };

   const handlePackageSubmit = () => {
      if (!pkgForm.title || !pkgForm.price) return toast.error('โปรดกรอกชื่อและราคาแพ็กเกจ');
      const newPkg = {
         ...pkgForm,
         title: pkgForm.title.trim(),
         price: Number(pkgForm.price),
         deliveryTime: Number(pkgForm.deliveryTime) || 0,
         features: String(pkgForm.features || '').split(',').map(f => f.trim()).filter(Boolean)
      };
      if (pkgEditingIndex !== null) {
         const updated = [...servicePackages];
         updated[pkgEditingIndex] = newPkg;
         setServicePackages(updated);
      } else {
         setServicePackages([...servicePackages, newPkg]);
      }
      setShowPkgModal(false);
      setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '', coverImages: [] });
      setPkgEditingIndex(null);
   };

   const handlePackageEdit = (index) => {
      const pkg = servicePackages[index];
      setPkgForm({ ...pkg, features: Array.isArray(pkg.features) ? pkg.features.join(', ') : '', coverImages: pkg.coverImages || [] });
      setPkgEditingIndex(index);
      setShowPkgModal(true);
   };

   const handlePackageCreate = () => {
      setPkgEditingIndex(null);
      setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '', coverImages: [] });
      setShowPkgModal(true);
   };

   const handlePackageClose = () => {
      setShowPkgModal(false);
      setPkgEditingIndex(null);
      setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '', coverImages: [] });
   };

   const handleDeletePackage = async (index) => {
      if (await customConfirm('ยืนยันการลบแพ็กเกจนี้?')) {
         setServicePackages(servicePackages.filter((_, i) => i !== index));
      }
   };

   const handlePackageImageUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      if (pkgForm.coverImages.length + files.length > 5) {
         return toast.error('You can only upload up to 5 images per package.');
      }

      const uploadPromises = files.map(async (file) => {
         const formData = new FormData();
         formData.append('file', file);
         try {
            const res = await uploadAPI.uploadSingle(formData);
            return res.file || res.url;
         } catch (error) {
            console.error('Package image upload error:', error);
            toast.error('Failed to upload ' + file.name);
            return null;
         }
      });

      toast.promise(Promise.all(uploadPromises), {
         loading: 'Uploading images...',
         success: 'Images uploaded successfully!',
         error: 'Some images failed to upload.'
      }).then(urls => {
         const validUrls = urls.filter(Boolean);
         if (validUrls.length > 0) {
            setPkgForm(prev => ({
               ...prev,
               coverImages: [...prev.coverImages, ...validUrls.map(url => ({ url, publicId: url }))]
            }));
         }
      });
   };

   const handleRemovePackageImage = (indexToRemove) => {
      setPkgForm(prev => ({
         ...prev,
         coverImages: prev.coverImages.filter((_, i) => i !== indexToRemove)
      }));
   };

   const handleSaveProfile = async () => {
      try {
         const parsedTags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
         const updatePayload = {
            name: nameText, bio: bioText, profession: professionText, isAvailableForHire: isAvailable,
            serviceTags: parsedTags, username: usernameText, phone: phoneText, address: addressText,
            birthday: birthdayText, gender: genderText, experience: experience, skills: skills,
            servicePackages: servicePackages, website: websiteText
         };
         await usersAPI.updateProfile(updatePayload, currentToken);
         setProfile(p => ({ ...p, ...updatePayload }));
         if (updateUser) updateUser(updatePayload);
         if (refreshContext) refreshContext();
         setEditingProfile(false);
      } catch { toast.error('Profile update failed.'); }
   };

   const onFileSelect = (e, type) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
         setImageToCrop(reader.result);
         setCropConfig({ type, aspect: type === 'profile' ? 1 : 16 / 5 });
      };
      reader.readAsDataURL(file);
      e.target.value = null;
   };

   const handleCroppedImage = async (blob) => {
      const type = cropConfig.type;
      setImageToCrop(null);
      const formData = new FormData();
      formData.append('image', new File([blob], "cropped.jpg", { type: "image/jpeg" }));
      if (type === 'profile') {
         setAvatarLoading(true);
         try {
            const res = await usersAPI.updateProfileImage(formData, currentToken);
            setProfile(p => ({ ...p, profileImage: res.profileImage }));
            if (updateUser) updateUser({ profileImage: res.profileImage });
            if (refreshContext) refreshContext();
         } catch { toast.error('Image upload failed.'); }
         finally { setAvatarLoading(false); }
      } else {
         setCoverLoading(true);
         try {
            const res = await usersAPI.updateCoverImage(formData, currentToken);
            setProfile(p => ({ ...p, coverImage: res.coverImage }));
            if (updateUser) updateUser({ coverImage: res.coverImage });
            if (refreshContext) refreshContext();
         } catch { toast.error('Cover upload failed.'); }
         finally { setCoverLoading(false); }
      }
   };

   const handleStartChat = async () => {
      if (!currentToken) return toast.error('กรุณาเข้าสู่ระบบก่อนครับ');
      try {
         const conv = await chatAPI.getOrCreateConversation(targetProfileId, currentToken);
         navigate(`/messenger/${conv._id}`);
      } catch { toast.error('Secure connection failed.'); }
   };

   if (loading) return (
      <PremiumLoader text="Syncing Identity..." subtext="กำลังโหลดข้อมูลโปรไฟล์..." />
   );

   if (!profile) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px' }}>
         <FiUserX size={60} color="#333" />
         <span style={{ color: '#fff', fontWeight: '700', letterSpacing: '2px', fontSize: '0.85rem' }}>IDENTITY NOT FOUND OR CONNECTION ERROR</span>
         <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '20px' }}>RETRY CONNECTION</button>
      </div>
   );

   const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

   const searchParamsUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
   const sharedPkgId = searchParamsUrl?.get('pkgId');
   const sharedPkg = sharedPkgId && profile?.servicePackages ? profile.servicePackages.find(p => p._id === sharedPkgId) : null;

   const pageTitle = sharedPkg
      ? `${sharedPkg.title} | ${profile?.name}`
      : `${profile?.name} | ${profile?.profession || 'Freelancer'} | Pattayapal Portfolio`;

   const pageDesc = sharedPkg
      ? (sharedPkg.description ? sharedPkg.description.substring(0, 150) : `แพ็กเกจบริการโดย ${profile?.name}`)
      : (profile?.bio ? profile.bio.substring(0, 150) : `โปรไฟล์ของ ${profile?.name} บน PattayaPal`);

   const pageImage = sharedPkg && sharedPkg.coverImages?.length > 0
      ? getFullUrl(sharedPkg.coverImages[0].url || sharedPkg.coverImages[0])
      : (profile?.profileImage?.url ? getFullUrl(profile.profileImage.url) : '');

   const pageUrl = typeof window !== 'undefined' ? window.location.href : '';


   /* ── derived view data (no hooks below the early returns) ── */
   const fmt = (n) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n) || 0);
   const avatarRaw = profile.profileImage?.url || (typeof profile.profileImage === 'string' ? profile.profileImage : '');
   const avatarSrc = avatarRaw ? getFullUrl(avatarRaw) + (isMyProfile ? `?t=${profileUpdateTag}` : '') : '';
   const coverSrc = profile.coverImage?.url ? getFullUrl(profile.coverImage.url) + (isMyProfile ? `?t=${profileUpdateTag}` : '') : '';
   const friendList = Array.isArray(profile.friends) ? profile.friends.filter(f => f && typeof f === 'object' && f.name) : [];
   const friendCount = profile.friends?.length || 0;
   const profileSkills = Array.isArray(profile.skills) ? profile.skills : skills;
   const profileExperience = Array.isArray(profile.experience) ? profile.experience : experience;
   const serviceTags = Array.isArray(profile.serviceTags) ? profile.serviceTags : [];
   const availableForHire = profile.isAvailableForHire ?? true;
   const websiteHref = profile.website ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`) : '';
   const websiteLabel = profile.website ? profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
   const photoTiles = works.slice(0, 9);
   const photoOverflow = works.length > 9 ? works.length - 8 : 0;
   const visibleTiles = photoOverflow ? works.slice(0, 8) : photoTiles;
   const workThumb = (w) => (workIsVideo(w) ? getWorkPosterUrl(w) : getMediaUrl(w));

   const copyProfileLink = async () => {
      try {
         await navigator.clipboard.writeText(window.location.href);
         toast.success('คัดลอกลิงก์โปรไฟล์แล้ว');
      } catch { toast.error('คัดลอกลิงก์ไม่สำเร็จ'); }
   };

   const friendLabel = friendStatus === 'friends' ? 'Friends' : (friendStatus === 'pending_sent' ? 'Request sent' : (friendStatus === 'pending_received' ? 'Accept request' : 'Add friend'));
   const FriendIcon = friendStatus === 'friends' ? FiUserCheck : (friendStatus === 'pending_sent' ? FiClock : FiUserPlus);

   const tabId = activeTab === 'calendar' ? 'portfolio' : activeTab;
   const showSidebars = tabId !== 'portfolio';
   const tabs = [
      { id: 'portfolio', label: 'Portfolio', icon: <FiImage /> },
      { id: 'packages', label: 'Packages', icon: <FiBox /> },
      { id: 'about', label: 'Experience', icon: <FiBriefcase /> },
      { id: 'timeline', label: 'Timeline', icon: <FiMessageSquare /> }
   ];

   const aboutRows = [
      profile.profession ? { label: 'Role', value: profile.profession } : null,
      { label: 'Member since', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-' },
      profile.address ? { label: 'Location', value: profile.address } : null,
      websiteHref ? { label: 'Web', value: <a href={websiteHref} target="_blank" rel="noreferrer">{websiteLabel}</a> } : null
   ].filter(Boolean);

   return (
      <motion.div className="profile-page" onPointerDownCapture={handleProfileActionCapture} onClickCapture={handleProfileActionCapture} variants={containerVariants} initial="hidden" animate="show">
         <Helmet>
            <title>{pageTitle}</title>
            <meta name="description" content={pageDesc} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDesc} />
            {pageImage && <meta property="og:image" content={pageImage} />}
            <meta property="og:url" content={pageUrl} />
            <meta property="og:type" content="profile" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDesc} />
            {pageImage && <meta name="twitter:image" content={pageImage} />}
         </Helmet>

         <div className={`pf-shell pf-tab-${tabId}`}>
            {/* ───────── Hero card ───────── */}
            <header className="pf-hero">
               <div className="pf-cover" style={coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined} />

               <div className="pf-avatar">
                  <div className="pf-avatar-inner">
                     {avatarSrc && <img src={avatarSrc} alt={profile.name} onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />}
                     <div className="pf-avatar-fallback" style={{ display: avatarSrc ? 'none' : 'flex' }}>{(profile.name || 'U')[0]}</div>
                     {isMyProfile && (
                        <button type="button" className="av-up" aria-label="Change profile photo" onClick={() => fileInputRef.current.click()}><FiCamera size={26} /></button>
                     )}
                  </div>
               </div>

               <div className="pf-cover-actions">
                  {!isMyProfile ? (
                     <>
                        <button type="button" className="pf-btn pf-btn-primary" onClick={handleFriendAction} disabled={friendLoading}><FriendIcon /> {friendLabel}</button>
                        <button type="button" className="pf-btn pf-btn-secondary" onClick={handleStartChat}><FiMessageSquare /> Send message</button>
                     </>
                  ) : (
                     <>
                        <button type="button" className="pf-btn pf-btn-primary" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); coverInputRef.current.click(); }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); coverInputRef.current.click(); }}><FiCamera /> Change cover</button>
                        <button ref={editIdentityButtonRef} type="button" data-profile-action="edit-identity" onMouseDown={openIdentityEditor} onTouchStart={openIdentityEditor} onPointerDown={openIdentityEditor} onClick={openIdentityEditor} className="pf-btn pf-btn-secondary profile-edit-identity-btn"><FiEdit3 /> Edit profile</button>
                     </>
                  )}
               </div>

               <div className="pf-hero-bar">
                  <dl className="pf-stats">
                     <div><dt>Posts</dt><dd>{fmt(userPosts.length)}</dd></div>
                     <div><dt>Friends</dt><dd>{fmt(friendCount)}</dd></div>
                     <div><dt>Views</dt><dd>{fmt(profile.totalViews)}</dd></div>
                  </dl>

                  <div className="pf-identity">
                     <h1>{profile.name}</h1>
                     <p className="pf-handle">@{profile.username || profile._id}</p>
                     <p className="pf-presence"><span className={`pf-dot ${isOnline ? 'is-on' : ''}`} />{isOnline ? 'Online now' : (formatLastSeen(lastSeen) || 'Offline')}</p>
                  </div>

                  <div className="pf-social">
                     {websiteHref && <a className="pf-social-btn is-accent" href={websiteHref} target="_blank" rel="noreferrer" aria-label="Open website" title="Website"><FiGlobe /></a>}
                     <button type="button" className="pf-social-btn is-yellow" onClick={copyProfileLink} aria-label="Copy profile link" title="Copy profile link"><FiLink /></button>
                     <button type="button" className="pf-social-btn is-orange" onClick={() => document.getElementById('pf-calendar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} aria-label="Go to availability calendar" title="Availability calendar"><FiCalendar /></button>
                  </div>
               </div>
            </header>

            {/* ───────── Tab bar ───────── */}
            <nav className="pf-tabs" role="tablist" aria-label="Profile sections">
               {tabs.map(tab => (
                  <button key={tab.id} type="button" role="tab" aria-selected={tabId === tab.id} className={`pf-tab ${tabId === tab.id ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                     {tab.icon}<span>{tab.label}</span>
                  </button>
               ))}
            </nav>

            {/* ───────── 3-column body ───────── */}
            <div className="pf-grid">
               {/* Left column */}
               <aside className="pf-col pf-col-left">
                  <section className="pf-card">
                     <h3 className="pf-card-title">About me</h3>
                     <p className="pf-bio">{profile.bio || 'This person has not written a bio yet.'}</p>
                     <dl className="pf-rows">
                        {aboutRows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
                     </dl>
                  </section>

                  <section className="pf-card">
                     <h3 className="pf-card-title">Rank</h3>
                     <div className="pf-rank">
                        <RankBadge rank={profile.rank} size="xl" showName={false} />
                        <div>
                           <strong>{profile.rank || 'Bronze'}</strong>
                           <span>{(profile.points || 0).toLocaleString()} XP</span>
                        </div>
                     </div>
                     {rankProgress && (
                        <div className="pf-progress">
                           <div className="pf-progress-meta">
                              <span>{rankProgress.currentPoints} / {rankProgress.currentPoints + rankProgress.pointsToNext} XP</span>
                              <span>{rankProgress.nextRank ? `Next: ${rankProgress.nextRank}` : 'Max rank'}</span>
                           </div>
                           <div className="pf-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${rankProgress.progress || 0}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} /></div>
                        </div>
                     )}
                  </section>

                  {friendList.length > 0 && (
                     <section className="pf-card">
                        <h3 className="pf-card-title">Friends <em>{friendCount}</em></h3>
                        <ul className="pf-friends">
                           {friendList.slice(0, 5).map(f => {
                              const fImg = f.profileImage?.url || (typeof f.profileImage === 'string' ? f.profileImage : '');
                              return (
                                 <li key={f._id}>
                                    <Link to={f.username ? `/${f.username}` : `/profile/${f._id}`}>
                                       <span className="pf-friend-avatar">{fImg ? <img src={getFullUrl(fImg)} alt="" loading="lazy" /> : (f.name || 'U')[0]}</span>
                                       <span className="pf-friend-name">{f.name}</span>
                                    </Link>
                                 </li>
                              );
                           })}
                        </ul>
                     </section>
                  )}
               </aside>

               {/* Center column */}
               <main className="pf-col pf-col-main">
                  <AnimatePresence mode="wait">
                     <motion.div key={tabId} className="pf-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {tabId === 'portfolio' && (
                           works.length > 0 ? (
                              <>
                                 <div className="pf-works">
                                    {works.slice(0, visibleWorks).map((w, i) => (
                                       <article className={`pf-card pf-work${i === 0 ? ' pf-work-featured' : ''}`} key={w._id} onClick={() => navigate(`/works/${w._id}`)}>
                                          <div className="pf-work-media">
                                             {workIsVideo(w)
                                                ? <HoverVideoPlayer src={getWorkVideoUrl(w)} poster={getWorkPosterUrl(w)} style={{ width: '100%', height: '100%' }} />
                                                : getMediaUrl(w) ? <img src={getMediaUrl(w)} alt={w.title} loading="lazy" /> : <span>No preview</span>}
                                          </div>
                                          <div className="pf-work-body">
                                             <span>{w.title}</span>
                                             <div><span>{w.category?.name}</span><span>{new Date(w.createdAt).getFullYear()}</span></div>
                                          </div>
                                       </article>
                                    ))}
                                 </div>
                                 {works.length > visibleWorks && (
                                    <div className="pf-more">
                                       <span>Showing {visibleWorks} of {works.length}</span>
                                       <button type="button" className="pf-btn pf-btn-secondary" onClick={() => setVisibleWorks(v => v + 9)}>Show more works</button>
                                    </div>
                                 )}
                              </>
                           ) : <div className="pf-card pf-empty"><FiImage /><strong>No works yet</strong><span>Published works will appear here.</span></div>
                        )}

                        {tabId === 'packages' && (
                           (profile.servicePackages || []).length > 0 ? (
                              <div className="pf-packages">
                                 {profile.servicePackages.map((pkg, i) => {
                                    const cover = pkg.coverImages?.[0] ? getFullUrl(pkg.coverImages[0].url || pkg.coverImages[0]) : '';
                                    return (
                                       <article key={pkg._id || i} className="pf-card pf-pkg">
                                          {cover && <div className="pf-pkg-cover"><img src={cover} alt="" loading="lazy" /></div>}
                                          <div className="pf-pkg-body">
                                             <div className="pf-pkg-head">
                                                <span className="pf-pkg-title">{pkg.title}</span>
                                                <span className="pf-price">
                                                   <CoinIcon size={16} />
                                                   <span className="pf-price-num">{Number(pkg.price).toLocaleString()}</span>
                                                </span>
                                             </div>
                                             <p className="pf-pkg-meta"><FiClock /> {pkg.deliveryTime} days delivery</p>
                                             {pkg.description && <p className="pf-pkg-desc">{pkg.description}</p>}
                                             {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                                                <ul className="pf-pkg-features">{pkg.features.slice(0, 4).map((f, k) => <li key={k}><FiCheck /> {f}</li>)}</ul>
                                             )}
                                             <div className="pf-pkg-actions">
                                                {!isMyProfile
                                                   ? <button type="button" className="pf-btn pf-btn-primary" onClick={() => { setSelectedPackage(pkg); setShowHireModal(true); }}>Request booking</button>
                                                   : <span className="pf-own-tag">Your package</span>}
                                                <button ref={(el) => { sharePackageButtonRefs.current[i] = el; }} type="button" className="pf-icon-btn" aria-label="Share package" data-profile-action="share-package" data-package-index={i} onMouseDown={(e) => openPackageShare(e, pkg)} onTouchStart={(e) => openPackageShare(e, pkg)} onPointerDown={(e) => openPackageShare(e, pkg)} onClick={(e) => openPackageShare(e, pkg)}><FiShare2 /></button>
                                             </div>
                                          </div>
                                       </article>
                                    );
                                 })}
                              </div>
                           ) : <div className="pf-card pf-empty"><FiBox /><strong>No packages yet</strong><span>Service packages will appear here.</span></div>
                        )}

                        {tabId === 'about' && (
                           <section className="pf-card">
                              <span className="pf-card-title">Experience</span>
                              {profileExperience.length > 0 ? (
                                 <ol className="pf-timeline">
                                    {profileExperience.map((exp, i) => (
                                       <li key={i}>
                                          <span className="pf-timeline-dot" />
                                          <time>{exp.duration}</time>
                                          <h4>{exp.role}</h4>
                                          <strong>{exp.company}</strong>
                                          {exp.description && <p>{exp.description}</p>}
                                       </li>
                                    ))}
                                 </ol>
                              ) : <div className="pf-empty pf-empty-inline"><FiBriefcase /><strong>No experience recorded</strong></div>}
                           </section>
                        )}

                        {tabId === 'timeline' && (
                           userPosts.length > 0 ? (
                              <div className="pf-card pf-feed">
                                 {userPosts.map(post => (
                                    <div className="pf-feed-item" key={post._id}>
                                       <FeedPost post={post} onPostDeleted={(id) => setUserPosts(prev => prev.filter(p => p._id !== id))} isCommentsOpen={activeCommentPostId === post._id} onToggleComments={handleToggleComments} />
                                    </div>
                                 ))}
                              </div>
                           ) : <div className="pf-card pf-empty"><FiMessageSquare /><strong>No posts yet</strong><span>Posts will appear here.</span></div>
                        )}

                     </motion.div>
                  </AnimatePresence>
               </main>

               {/* Right column */}
               <aside className="pf-col pf-col-right">
                  <section className="pf-card pf-calendar-card" id="pf-calendar">
                     <AvailabilityCalendar userId={profile._id} isOwner={false} profileName={profile.name} />
                  </section>

                  <section className="pf-card">
                     <h3 className="pf-card-title">Skills <em>{profileSkills.length}</em></h3>
                     {profileSkills.length > 0 ? (
                        <ul className="pf-skills">
                           {profileSkills.slice(0, 6).map((s, i) => (
                              <li key={`${s.name}-${i}`}>
                                 <div><span>{s.name}</span><b>{s.level ?? 50}%</b></div>
                                 <div className="pf-bar"><i style={{ width: `${s.level ?? 50}%` }} /></div>
                              </li>
                           ))}
                        </ul>
                     ) : <p className="pf-muted-line">No skills listed.</p>}
                     {profileSkills.length > 6 && <p className="pf-muted-line pf-more-line">+{profileSkills.length - 6} more skills</p>}
                  </section>

                  {works.length > 0 && (
                     <section className="pf-card">
                        <h3 className="pf-card-title">Works <em>{works.length}</em></h3>
                        <div className="pf-photos">
                           {visibleTiles.map(w => (
                              <button type="button" key={w._id} className="pf-photo" onClick={() => navigate(`/works/${w._id}`)} aria-label={w.title}>
                                 {workThumb(w) ? <img src={workThumb(w)} alt="" loading="lazy" /> : <FiImage />}
                              </button>
                           ))}
                           {photoOverflow > 0 && <button type="button" className="pf-photo pf-photo-more" onClick={() => setActiveTab('portfolio')}>+{photoOverflow}</button>}
                        </div>
                     </section>
                  )}
               </aside>
            </div>
         </div>

         {typeof document !== 'undefined' && createPortal(<>
            {imageToCrop && <ImageCropModal image={imageToCrop} aspect={cropConfig.aspect} title="Crop identity image" onClose={() => setImageToCrop(null)} onCropComplete={handleCroppedImage} />}
            {editingProfile && (
               <div className="profile-edit-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' }}>
                  <motion.div initial={{ scale: 0.96, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="glass profile-edit-modal" style={{ padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)' }}>
                     <h3 className="profile-edit-title">EDIT PROFILE RECORD</h3>
                     <div className="profile-edit-form">
                        <section className="profile-edit-section">
                           <div className="profile-edit-section-head">
                              <div><span>01</span><h4>Identity & contact</h4></div>
                              <p>Public profile details and contact information.</p>
                           </div>
                           <div className="edit-row-grid">
                              <div className="profile-edit-field"><label>Legal name</label><input value={nameText} onChange={e => setNameText(e.target.value)} placeholder="Full name" /></div>
                              <div className="profile-edit-field"><label>Username (@handle)</label><input value={usernameText} onChange={e => setUsernameText(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="username" /></div>
                           </div>
                           <div className="profile-edit-field"><label>Biography</label><textarea value={bioText} onChange={e => setBioText(e.target.value)} rows={3} placeholder="Tell people about your work." /></div>
                           <div className="edit-row-grid">
                              <div className="profile-edit-field">
                                 <label>Gender identity</label>
                                 <CustomSelect value={genderText} onChange={setGenderText} options={[{ value: "None", label: "Prefer not to say" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
                              </div>
                              <div className="profile-edit-field">
                                 <label>Professional role</label>
                                 <CustomSelect value={professionText} onChange={setProfessionText} options={[{ value: "General", label: "General User" }, { value: "Photographer", label: "Photographer" }, { value: "Videographer", label: "Videographer" }, { value: "Editor", label: "Editor" }, { value: "Director", label: "Director" }, { value: "Production Design", label: "Production Design" }, { value: "Creative Content", label: "Creative Content" }, { value: "Film Production", label: "Film Production" }, { value: "Post Production", label: "Post Production" }, { value: "Digital Artist", label: "Digital Artist" }, { value: "AI Operations", label: "AI Operations" }, { value: "AI Artist", label: "AI Artist" }, { value: "AI Animator", label: "AI Animator" }, { value: "AI Sound Designer", label: "AI Sound Designer" }, { value: "AI 3D Artist", label: "AI 3D Artist" }, { value: "AI Director", label: "AI Director" }, { value: "AI Producer", label: "AI Producer" }, { value: "KOL", label: "KOL" }, { value: "Influencer", label: "Influencer" }, { value: "Content Creator", label: "Content Creator" }, { value: "Tutor", label: "Tutor" }]} />
                              </div>
                           </div>
                           <div className="edit-row-grid">
                              <div className="profile-edit-field"><label>Contact phone</label><input value={phoneText} onChange={e => setPhoneText(e.target.value)} placeholder="+66 ..." /></div>
                              <div className="profile-edit-field"><label>Date of birth</label><input type="date" value={birthdayText} onChange={e => setBirthdayText(e.target.value)} /></div>
                           </div>
                           <div className="profile-edit-field"><label>Address / city</label><input value={addressText} onChange={e => setAddressText(e.target.value)} placeholder="City, country" /></div>
                        </section>

                        <section className="profile-edit-section">
                           <div className="profile-edit-section-head">
                              <div><span>02</span><h4>Services & discovery</h4></div>
                              <p>Help clients find your profile and understand your offer.</p>
                           </div>
                           <div className="profile-edit-field"><label>Website</label><input value={websiteText} onChange={e => setWebsiteText(e.target.value)} placeholder="https://your-portfolio.com" /></div>
                           <div className="profile-edit-field"><label>Service tags</label><input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="Photography, Retouching, Art Direction" /><small>Separate tags with commas.</small></div>
                           <label className="profile-availability-row" htmlFor="avail-check">
                              <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} id="avail-check" />
                              <span><strong>Open for professional assignments</strong><small>Show clients that you are currently available for work.</small></span>
                           </label>
                        </section>

                        <section className="profile-edit-section">
                           <div className="profile-edit-section-head profile-edit-section-head-action">
                              <div><span>03</span><h4>Skills</h4></div>
                              <button type="button" className="profile-edit-add" onClick={() => setSkills([...skills, { name: '', category: 'General', level: 50 }])}><FiPlus /> Add skill</button>
                           </div>
                           <div className="profile-edit-stack">
                              {skills.map((skill, index) => (
                                 <div className="profile-edit-item profile-skill-item" key={index}>
                                    <button type="button" className="profile-edit-remove" onClick={() => setSkills(skills.filter((_, i) => i !== index))} aria-label="Remove skill"><FiTrash2 /></button>
                                    <div className="edit-row-grid">
                                       <div className="profile-edit-field">
                                          <label>Skill name</label>
                                          <input value={skill.name} list={`production-skills-${index}`} onChange={e => { const next = [...skills]; next[index] = { ...next[index], name: e.target.value }; setSkills(next); }} placeholder="e.g. Photoshop" />
                                          <datalist id={`production-skills-${index}`}>{PRODUCTION_SKILLS.map(value => <option key={value} value={value} />)}</datalist>
                                       </div>
                                       <div className="profile-edit-field">
                                          <label>Category</label>
                                          <select value={skill.category || 'General'} onChange={e => { const next = [...skills]; next[index] = { ...next[index], category: e.target.value }; setSkills(next); }}>{SKILL_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select>
                                       </div>
                                    </div>
                                    <div className="profile-skill-level"><input type="range" min="0" max="100" value={skill.level ?? 50} onChange={e => { const next = [...skills]; next[index] = { ...next[index], level: Number(e.target.value) }; setSkills(next); }} /><strong>{skill.level ?? 50}%</strong></div>
                                 </div>
                              ))}
                              {skills.length === 0 && <div className="profile-edit-empty">No skills added yet.</div>}
                           </div>
                        </section>

                        <section className="profile-edit-section">
                           <div className="profile-edit-section-head profile-edit-section-head-action">
                              <div><span>04</span><h4>Experience</h4></div>
                              <button type="button" className="profile-edit-add" onClick={() => setExperience([...experience, { company: '', role: '', duration: '', description: '' }])}><FiPlus /> Add item</button>
                           </div>
                           <div className="profile-edit-stack">
                              {experience.map((exp, index) => (
                                 <div className="profile-edit-item" key={index}>
                                    <button type="button" className="profile-edit-remove" onClick={() => setExperience(experience.filter((_, i) => i !== index))} aria-label="Remove experience"><FiTrash2 /></button>
                                    <div className="edit-row-grid">
                                       <div className="profile-edit-field"><label>Role</label><input value={exp.role} onChange={e => { const next = [...experience]; next[index] = { ...next[index], role: e.target.value }; setExperience(next); }} placeholder="Senior Editor" /></div>
                                       <div className="profile-edit-field"><label>Company</label><input value={exp.company} onChange={e => { const next = [...experience]; next[index] = { ...next[index], company: e.target.value }; setExperience(next); }} placeholder="Company / Studio" /></div>
                                    </div>
                                    <div className="profile-edit-field"><label>Duration</label><input value={exp.duration} onChange={e => { const next = [...experience]; next[index] = { ...next[index], duration: e.target.value }; setExperience(next); }} placeholder="2022 - Present" /></div>
                                    <div className="profile-edit-field"><label>Description</label><textarea value={exp.description} onChange={e => { const next = [...experience]; next[index] = { ...next[index], description: e.target.value }; setExperience(next); }} rows={2} placeholder="Responsibilities and achievements." /></div>
                                 </div>
                              ))}
                              {experience.length === 0 && <div className="profile-edit-empty">No experience records yet.</div>}
                           </div>
                        </section>

                        <section className="profile-edit-section profile-package-section">
                           <div className="profile-edit-section-head profile-edit-section-head-action">
                              <div><span>05</span><h4>Service packages</h4></div>
                              <button type="button" className="profile-edit-add profile-edit-add-primary" onClick={handlePackageCreate}><FiPlus /> Create package</button>
                           </div>
                           <p className="profile-package-help">Create clear offers with a coin price, delivery time, features, and description.</p>
                           <div className="profile-package-list">
                              {servicePackages.map((pkg, index) => (
                                 <div className="profile-package-edit-card" key={index}>
                                    <div className="profile-package-edit-main">
                                       <span>Package {String(index + 1).padStart(2, '0')}</span>
                                       <h5>{pkg.title || 'Untitled package'}</h5>
                                       <div><CoinIcon size={16} /> <strong>{Number(pkg.price || 0).toLocaleString()}</strong><i /> <FiClock /> {pkg.deliveryTime || 0} days</div>
                                    </div>
                                    <div className="profile-package-edit-actions">
                                       <button type="button" onClick={() => handlePackageEdit(index)}><FiEdit3 /> Edit</button>
                                       <button type="button" className="danger" onClick={() => handleDeletePackage(index)}><FiTrash2 /> Delete</button>
                                    </div>
                                 </div>
                              ))}
                              {servicePackages.length === 0 && <div className="profile-edit-empty profile-package-empty"><FiBox /><strong>No packages created</strong><span>Create your first service package to receive booking requests.</span></div>}
                           </div>
                        </section>

                        <div className="profile-edit-actions">
                           <button type="button" className="profile-edit-save" onClick={handleSaveProfile}><FiSave /> Save all changes</button>
                           <button type="button" className="profile-edit-cancel" onClick={() => setEditingProfile(false)}>Cancel</button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}

            <AnimatePresence>
               {showPkgModal && (
                  <div className="package-edit-overlay">
                     <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="package-edit-modal">
                        <div className="package-edit-heading">
                           <div><span>{pkgEditingIndex !== null ? 'Update offer' : 'New offer'}</span><h3>{pkgEditingIndex !== null ? 'EDIT SERVICE PACKAGE' : 'CREATE SERVICE PACKAGE'}</h3></div>
                           <button type="button" onClick={handlePackageClose} aria-label="Close package editor"><FiX /></button>
                        </div>
                        <div className="package-edit-form">
                           <div className="profile-edit-field"><label>Package title</label><input value={pkgForm.title} onChange={e => setPkgForm({ ...pkgForm, title: e.target.value })} placeholder="e.g. Product photo set" /></div>
                           <div className="edit-row-grid">
                              <div className="profile-edit-field"><label>Price (coins)</label><input type="number" min="0" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} placeholder="1500" /></div>
                              <div className="profile-edit-field"><label>Delivery (days)</label><input type="number" min="0" value={pkgForm.deliveryTime} onChange={e => setPkgForm({ ...pkgForm, deliveryTime: e.target.value })} placeholder="7" /></div>
                           </div>
                           <div className="profile-edit-field"><label>Features</label><textarea value={pkgForm.features} onChange={e => setPkgForm({ ...pkgForm, features: e.target.value })} placeholder="10 edited photos, 2 revisions, Commercial use" rows={3} /><small>Separate features with commas.</small></div>
                           <div className="profile-edit-field"><label>Description</label><textarea value={pkgForm.description} onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })} placeholder="Explain what the client receives." rows={4} /></div>
                           <div className="profile-edit-field">
                              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cover Images (Max 5)</label>
                              <div
                                 onClick={() => document.getElementById('pkg-cover-upload').click()}
                                 style={{
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '30px 20px',
                                    textAlign: 'center',
                                    cursor: pkgForm.coverImages?.length >= 5 ? 'not-allowed' : 'pointer',
                                    background: 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.2s ease',
                                    opacity: pkgForm.coverImages?.length >= 5 ? 0.5 : 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px'
                                 }}
                                 onMouseEnter={e => { if (pkgForm.coverImages?.length < 5) { e.currentTarget.style.border = '2px dashed var(--accent)'; e.currentTarget.style.background = 'rgba(255,87,51,0.05)'; } }}
                                 onMouseLeave={e => { e.currentTarget.style.border = '2px dashed rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                              >
                                 <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                    <FiUploadCloud size={24} />
                                 </div>
                                 <div>
                                    <div style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                                       {pkgForm.coverImages?.length >= 5 ? 'Maximum 5 images reached' : 'Click to upload images'}
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>PNG, JPG or WEBP (Max 5MB each)</div>
                                 </div>
                                 <input
                                    id="pkg-cover-upload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePackageImageUpload}
                                    disabled={pkgForm.coverImages?.length >= 5}
                                    style={{ display: 'none' }}
                                 />
                              </div>
                              {pkgForm.coverImages && pkgForm.coverImages.length > 0 && (
                                 <div className="package-image-previews" style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    {pkgForm.coverImages.map((img, i) => (
                                       <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                                          <img src={getFullUrl(img.url)} alt={`preview-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          <button type="button" onClick={() => handleRemovePackageImage(i)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={12} /></button>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                           <div className="package-edit-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {pkgEditingIndex !== null && (
                                 <button
                                    type="button"
                                    className="profile-edit-cancel"
                                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                                    onClick={async () => {
                                       if (await customConfirm('ยืนยันการลบแพ็กเกจนี้?')) {
                                          setServicePackages(prev => prev.filter((_, i) => i !== pkgEditingIndex));
                                          handlePackageClose();
                                       }
                                    }}
                                 >
                                    <FiTrash2 /> Delete
                                 </button>
                              )}
                              <button type="button" className="profile-edit-save" onClick={handlePackageSubmit} style={{ flex: 1 }}><FiCheck /> {pkgEditingIndex !== null ? 'Update package' : 'Add package'}</button>
                              <button type="button" className="profile-edit-cancel" onClick={handlePackageClose}>Close</button>
                           </div>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>

            {sharePackage && <SharePackageModal pkg={sharePackage} profile={profile} onClose={() => setSharePackage(null)} />}
            {showHireModal && <HireModal freelancerId={targetProfileId} freelancerName={profile?.name} currentToken={currentToken} initialData={selectedPackage ? { title: `จ้างงาน: ${selectedPackage.title}`, budget: selectedPackage.price, description: `จ้างงานตามแพ็กเกจ ${selectedPackage.title}` } : null} onClose={() => { setShowHireModal(false); setSelectedPackage(null); }} />}
         </>, document.body)}

         <Footer />
         <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => onFileSelect(e, 'profile')} />
         <input type="file" ref={coverInputRef} style={{ display: 'none' }} onChange={e => onFileSelect(e, 'cover')} />
      </motion.div>
   );
}
export default UserProfile;