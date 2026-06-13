import { customConfirm } from '../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { usersAPI, chatAPI, worksAPI, postsAPI } from '../utils/api';
import FeedPost from '../components/FeedPost';
import { getFullUrl, getMediaUrl, getWorkPosterUrl, getWorkVideoUrl, isVideoUrl, workIsVideo } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import HireModal from '../components/HireModal';
import ImageCropModal from '../components/ImageCropModal';
import HoverVideoPlayer from '../components/HoverVideoPlayer';
import { useSocket } from '../context/SocketContext';
import { formatLastSeen } from '../utils/timeUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
   FiMessageSquare, FiUserPlus, FiUserCheck, FiUserX, FiBriefcase,
   FiCalendar, FiLayers, FiMessageCircle, FiUsers, FiClock, FiTrash2, FiEdit3, FiSave, FiCheck, FiX, FiShare2, FiPlus, FiVideo, FiMic, FiType, FiCamera, FiLayout, FiMaximize2, FiMinimize2, FiBox, FiActivity, FiZap, FiAward, FiCheckCircle,
   FiMapPin, FiMail, FiGlobe, FiPhone, FiStar, FiBookmark
} from 'react-icons/fi';
import CustomSelect from '../components/CustomSelect';
import SharePackageModal from '../components/SharePackageModal';
import RankBadge from '../components/RankBadge';
import ProfileFrame from '../components/ProfileFrame';
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

   const [servicePackages, setServicePackages] = useState([]);
   const [showPkgModal, setShowPkgModal] = useState(false);
   const [pkgEditingIndex, setPkgEditingIndex] = useState(null);
   const [pkgForm, setPkgForm] = useState({ title: '', price: '', deliveryTime: '', description: '', features: '' });
   const [activeTab, setActiveTab] = useState(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'portfolio';
   });
   const [friendRequests, setFriendRequests] = useState([]);
   const [rankProgress, setRankProgress] = useState(null);
   const [showHireModal, setShowHireModal] = useState(false);
   const [selectedPackage, setSelectedPackage] = useState(null);
   const [sharePackage, setSharePackage] = useState(null);
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
               data = await usersAPI.getPublicProfileByUsername(username);
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
            setBirthdayText(data.user?.birthday ? new Date(data.user.birthday).toISOString().split('T')[0] : '');
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
         } catch (err) { console.error('Profile fetch failed', err); }
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
      setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '' });
      setPkgEditingIndex(null);
   };

   const handlePackageEdit = (index) => {
      const pkg = servicePackages[index];
      setPkgForm({ ...pkg, features: Array.isArray(pkg.features) ? pkg.features.join(', ') : '' });
      setPkgEditingIndex(index);
      setShowPkgModal(true);
   };

   const handlePackageCreate = () => {
      setPkgEditingIndex(null);
      setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '' });
      setShowPkgModal(true);
   };

   const handlePackageClose = () => {
      setShowPkgModal(false);
      setPkgEditingIndex(null);
      setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '' });
   };

   const handleDeletePackage = async (index) => {
      if (await customConfirm('ยืนยันการลบแพ็กเกจนี้?')) {
         setServicePackages(servicePackages.filter((_, i) => i !== index));
      }
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

   return (
      <motion.div className="profile-page" onPointerDownCapture={handleProfileActionCapture} onClickCapture={handleProfileActionCapture} variants={containerVariants} initial="hidden" animate="show" style={{ minHeight: '100vh', background: '#050505', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
         <Helmet>
            <title>{profile?.name} | {profile?.profession || 'Freelancer'} | Pattayapal Portfolio</title>
         </Helmet>

         <div style={{ position: 'fixed', top: '10%', left: '5%', width: '400px', height: '400px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.05, pointerEvents: 'none' }} />
         <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '500px', height: '500px', background: 'var(--indigo)', filter: 'blur(180px)', opacity: 0.05, pointerEvents: 'none' }} />

         <div className="profile-cover-stage" style={{ width: '100%', height: '400px', position: 'relative', overflow: 'hidden' }}>
            <div className="profile-cover-media" style={{ position: 'absolute', inset: 0, background: profile.coverImage?.url ? `url(${getFullUrl(profile.coverImage.url) + (isMyProfile ? `?t=${profileUpdateTag}` : '')}) center/cover` : 'linear-gradient(45deg, #111, #222)', filter: 'brightness(0.7)' }} />
            <div className="profile-cover-scrim" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #050505 100%)' }} />
         </div>

         <div className="profile-main-container" style={{ position: 'relative', zIndex: 10 }}>
            <div className="profile-header-wrap" style={{ marginBottom: '50px', position: 'relative', zIndex: 11 }}>
               <div className="profile-main-flex" style={{ display: 'flex', gap: '30px', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', position: 'relative', zIndex: 12 }}>
                  <div className="profile-left-group" style={{ display: 'flex', gap: '30px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                     <div className="profile-avatar-plate" style={{ position: 'relative', flexShrink: 0 }}>
                        <ProfileFrame rank={profile.rank} points={profile.points || 0} size="140px" isOnline={profile.isOnline}>
                           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                              {profile.profileImage?.url || (typeof profile.profileImage === 'string' && profile.profileImage) ? (
                                 <img src={getFullUrl(profile.profileImage.url || profile.profileImage) + (isMyProfile ? `?t=${profileUpdateTag}` : '')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                              ) : null}
                              <div style={{ display: (profile.profileImage?.url || typeof profile.profileImage === 'string') ? 'none' : 'flex', fontSize: '3rem', fontWeight: '700', color: '#444' }}>{(profile.name || 'U')[0]}</div>
                              {isMyProfile && (
                                 <div onClick={() => fileInputRef.current.click()} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, cursor: 'pointer', transition: '0.3s', zIndex: 10 }} className="av-up"><FiCamera size={40} /></div>
                              )}
                           </div>
                        </ProfileFrame>
                     </div>
                     <div className="profile-info-text" style={{ paddingBottom: '20px' }}>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: '900', margin: 0, color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1 }}>{profile.name}</h1>
                        <div className="profile-identity-meta" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                           <span style={{ color: '#555', fontWeight: '700', fontSize: '1.1rem' }}>@{profile.username}</span>
                           <div className="profile-role-badge" style={{ background: 'rgba(255, 87, 51, 0.1)', padding: '6px 15px', borderRadius: '12px', border: '1px solid rgba(255, 87, 51, 0.1)' }}>
                              <span style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1px' }}>{profile.profession || 'GENERAL'}</span>
                           </div>
                        </div>
                        <div className="profile-hero-stats">
                           <span><FiActivity /> {isOnline ? 'Online now' : formatLastSeen(lastSeen) || 'Offline'}</span>
                           <span><FiLayers /> {works.length} Creations</span>
                           <span><FiAward /> {profile.rank || 'Bronze'} Rank</span>
                        </div>
                     </div>
                  </div>
                  <div className="profile-right-group" style={{ display: 'flex', gap: '15px', paddingBottom: '20px', flexWrap: 'wrap', position: 'relative', zIndex: 13 }}>
                     {!isMyProfile ? (
                        <>
                           <button onClick={handleStartChat} className="glass" style={{ background: '#fff', color: '#000', border: 'none', padding: '14px 25px', borderRadius: '15px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}>SEND MESSAGE</button>
                           <button onClick={handleFriendAction} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 25px', borderRadius: '15px', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                              {friendStatus === 'friends' ? <FiUserCheck /> : (friendStatus === 'pending_sent' ? <FiClock /> : <FiUserPlus />)} {friendStatus === 'friends' ? 'CONNECTED' : (friendStatus === 'pending_sent' ? 'PENDING' : 'CONNECT')}
                           </button>
                        </>
                     ) : (
                        <>
                           <button type="button" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); coverInputRef.current.click(); }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); coverInputRef.current.click(); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 25px', borderRadius: '15px', color: '#fff', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', backdropFilter: 'blur(10px)' }}><FiCamera style={{ marginRight: '8px' }} /> BACKGROUND</button>
                           <button ref={editIdentityButtonRef} type="button" data-profile-action="edit-identity" onMouseDown={openIdentityEditor} onTouchStart={openIdentityEditor} onPointerDown={openIdentityEditor} onClick={openIdentityEditor} className="profile-edit-identity-btn" style={{ padding: '14px 30px', borderRadius: '15px', color: '#fff', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.9rem', position: 'relative', zIndex: 14 }}>EDIT IDENTITY</button>
                        </>
                     )}
                  </div>
               </div>
            </div>

            <div className="profile-content-grid" style={{ gap: '30px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', minWidth: 0 }}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '2px' }}>IDENTITY RANK</label>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: ['Conqueror', 'Commander', 'Master'].includes(profile.rank) ? '#00d2ff' : 'var(--accent)' }}>XP: {(profile.points || 0).toLocaleString()}</div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <div style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.05))' }}><RankBadge rank={profile.rank} size="xl" showName={false} /></div>
                        <div><h4 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>{profile.rank}</h4></div>
                     </div>
                     {rankProgress && (
                        <div style={{ marginTop: '30px', minWidth: 0, overflow: 'hidden' }}>
                           <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '4px', fontSize: '0.65rem', fontWeight: '700', color: '#444', marginBottom: '10px', minWidth: 0, overflow: 'hidden' }}>
                              <span style={{ flexShrink: 0 }}>NEXT: {rankProgress.nextRank?.toUpperCase() || 'MAX'}</span>
                              <span style={{ textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{rankProgress.currentPoints} / {rankProgress.currentPoints + rankProgress.pointsToNext} XP ({Math.round(rankProgress.progress || 0)}%)</span>
                           </div>
                           <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${rankProgress.progress || 0}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: '100%', background: ['Conqueror', 'Commander', 'Master'].includes(profile.rank) ? '#00d2ff' : 'var(--accent)', boxShadow: `0 0 15px ${['Conqueror', 'Commander', 'Master'].includes(profile.rank) ? '#00d2ff' : 'var(--accent)'}` }} />
                           </div>
                        </div>
                     )}
                  </motion.div>

                  <div className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: '#555', letterSpacing: '2px', marginBottom: '20px' }}>BIOGRAPHY</h4>
                     <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#aaa', margin: 0 }}>{profile.bio || 'Identity bio data not established.'}</p>
                  </div>

                  <div className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: '#555', letterSpacing: '2px', marginBottom: '25px' }}>DETAILS & ADDRESS</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}><FiMapPin /></div>
                           <div style={{ minWidth: 0 }}><div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>ADDRESS</div><div style={{ fontSize: '1rem', fontWeight: '600', wordBreak: 'break-word' }}>{profile.address || 'Unknown'}</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--indigo)', flexShrink: 0 }}><FiCalendar /></div>
                           <div style={{ minWidth: 0 }}><div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>MEMBER SINCE</div><div style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(profile.createdAt).toLocaleDateString()}</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><FiGlobe /></div>
                           <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>{profile.website ? 'PERSONAL SITE' : 'PROFILE URL'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <a href={profile.website ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`) : `/${profile.username || 'profile/' + profile._id}`} target={profile.website ? "_blank" : "_self"} rel="noreferrer" style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--indigo)', wordBreak: 'break-all', textDecoration: 'none', transition: '0.3s' }}>
                                    {profile.website || `${window.location.host}/${profile.username || profile._id}`}
                                 </a>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="glass profile-stats-grid" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
                     <div><div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700', marginBottom: '5px' }}>FOLLOWERS</div><div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{profile.friends?.length || 0}</div></div>
                     <div><div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700', marginBottom: '5px' }}>VIEWS</div><div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff' }}>{(profile.totalViews || 0).toLocaleString()}</div></div>
                     <div><div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700', marginBottom: '5px' }}>POINTS</div><div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--indigo)' }}>{(profile.points || 0).toLocaleString()}</div></div>
                  </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div className="glass tabs-container" style={{ padding: '10px', borderRadius: '25px', display: 'flex', gap: '10px', width: 'fit-content', maxWidth: '100%', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                     {[
                        { id: 'portfolio', label: 'PORTFOLIO', icon: <FiActivity /> },
                        { id: 'packages', label: 'PACKAGES', icon: <FiZap /> },
                        { id: 'about', label: 'EXPERIENCE', icon: <FiAward /> },
                        { id: 'timeline', label: 'TIMELINE', icon: <FiClock /> }
                     ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? 'var(--accent)' : 'transparent', border: 'none', padding: '12px 25px', borderRadius: '18px', color: activeTab === tab.id ? '#fff' : '#666', fontWeight: '700', cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                           {tab.icon} {tab.label}
                        </button>
                     ))}
                  </div>

                  <div className="glass" style={{ minHeight: '600px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                     <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ padding: '40px' }}>
                           {activeTab === 'portfolio' && (
                              <div className="profile-portfolio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '30px' }}>
                                 {works.length > 0 ? works.map(w => (
                                    <motion.div className="profile-work-card" whileHover={{ y: -4 }} key={w._id} onClick={() => navigate(`/works/${w._id}`)} style={{ cursor: 'pointer', borderRadius: '30px', overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                       <div className="profile-work-media" style={{ height: '240px', overflow: 'hidden', position: 'relative', background: '#111' }}>
                                          {workIsVideo(w) ? <HoverVideoPlayer src={getWorkVideoUrl(w)} poster={getWorkPosterUrl(w)} style={{ width: '100%', height: '100%' }} /> : getMediaUrl(w) ? <img src={getMediaUrl(w)} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', fontSize: '0.65rem', letterSpacing: '3px' }}>NO PREVIEW</div>}
                                       </div>
                                       <div className="profile-work-body" style={{ padding: '25px' }}>
                                          <h4 className="profile-work-title" style={{ margin: '0 0 10px', fontSize: '1.2rem', color: '#fff' }}>{w.title}</h4>
                                          <div className="profile-work-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{w.category?.name}</span><span style={{ fontSize: '0.75rem', color: '#444' }}>{new Date(w.createdAt).getFullYear()}</span></div>
                                       </div>
                                    </motion.div>
                                 )) : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#444', fontWeight: '700', letterSpacing: '4px' }}>NO TIMELINE DATA</div>}
                              </div>
                           )}

                           {activeTab === 'packages' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '30px' }}>
                                 {profile.servicePackages?.map((pkg, i) => (
                                    <div key={i} className="glass" style={{ padding: '30px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                       <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px 20px', background: 'var(--accent)', color: '#fff', fontWeight: '700', borderBottomLeftRadius: '25px', fontSize: 'clamp(1rem, 4vw, 1.3rem)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '-5px 5px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
                                          <CoinIcon size={20} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} /> {Number(pkg.price).toLocaleString()}
                                       </div>
                                       <h4 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: '700', marginBottom: '15px', color: '#fff', paddingRight: '100px', wordBreak: 'break-word', marginTop: '10px' }}>{pkg.title}</h4>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666', marginBottom: '25px', fontSize: '0.9rem' }}><FiClock /> <span>{pkg.deliveryTime} DAYS DELIVERY</span></div>
                                       <p style={{ color: '#888', lineHeight: '1.6', marginBottom: '30px' }}>{pkg.description}</p>
                                       <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px', display: 'flex', gap: '10px' }}>
                                          {!isMyProfile ? <button type="button" onClick={() => { setSelectedPackage(pkg); setShowHireModal(true); }} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>REQUEST BOOKING</button> : <div style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.02)', color: '#444', fontWeight: '700', textAlign: 'center', fontSize: '0.8rem' }}>YOUR PACKAGE</div>}
                                          <motion.button ref={(el) => { sharePackageButtonRefs.current[i] = el; }} type="button" data-profile-action="share-package" data-package-index={i} onMouseDown={(e) => openPackageShare(e, pkg)} onTouchStart={(e) => openPackageShare(e, pkg)} onPointerDown={(e) => openPackageShare(e, pkg)} onClick={(e) => openPackageShare(e, pkg)} style={{ padding: '18px', borderRadius: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 20 }}><FiShare2 size={18} /></motion.button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}

                           {activeTab === 'about' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    {experience.length > 0 ? experience.map((exp, i) => (
                                       <div key={i} style={{ display: 'flex', gap: '30px', position: 'relative' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                             <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', boxSizing: 'border-box', border: '4px solid #050505', zIndex: 2 }} />
                                             {i !== experience.length - 1 && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.05)', marginTop: '0px' }} />}
                                          </div>
                                          <div style={{ paddingBottom: '40px' }}>
                                             <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '5px' }}>{exp.duration}</div>
                                             <h4 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 5px', color: '#fff' }}>{exp.role}</h4>
                                             <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#666', marginBottom: '15px' }}>{exp.company}</div>
                                             <p style={{ color: '#888', lineHeight: '1.6', margin: 0, fontSize: '0.95rem', maxWidth: '800px' }}>{exp.description}</p>
                                          </div>
                                       </div>
                                    )) : <div style={{ padding: '60px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.03)', borderRadius: '30px' }}><FiAward size={40} style={{ color: '#222', marginBottom: '15px' }} /><div style={{ color: '#444', fontWeight: '700', letterSpacing: '2px' }}>PROFESSIONAL HISTORY NOT RECORDED</div></div>}
                                 </div>
                              </div>
                           )}

                           {activeTab === 'timeline' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
                                 {userPosts.length > 0 ? userPosts.map(post => <FeedPost key={post._id} post={post} onDelete={(id) => setUserPosts(prev => prev.filter(p => p._id !== id))} />) : <div style={{ padding: '100px', textAlign: 'center', color: '#444', fontWeight: '700', letterSpacing: '4px' }}>NO SOCIAL POSTS RECORDED</div>}
                              </div>
                           )}

                        </motion.div>
                     </AnimatePresence>
                  </div>
               </div>
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
                        <div className="package-edit-actions">
                           <button type="button" className="profile-edit-save" onClick={handlePackageSubmit}><FiCheck /> {pkgEditingIndex !== null ? 'Update package' : 'Add package'}</button>
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
