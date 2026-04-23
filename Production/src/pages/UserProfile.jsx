import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { usersAPI, chatAPI, worksAPI } from '../utils/api';
import { getFullUrl, isVideoUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import HireModal from '../components/HireModal';
import ImageCropModal from '../components/ImageCropModal';
import { useSocket } from '../context/SocketContext';
import { formatLastSeen } from '../utils/timeUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
   FiMessageSquare, FiUserPlus, FiUserCheck, FiUserX, FiBriefcase,
   FiCalendar, FiLayers, FiMessageCircle, FiUsers, FiClock, FiTrash2, FiCamera, FiBox, FiActivity, FiZap, FiAward, FiCheckCircle,
   FiMapPin, FiMail, FiGlobe, FiPhone, FiStar, FiBookmark
} from 'react-icons/fi';
import RankBadge from '../components/RankBadge';
import ProfileFrame from '../components/ProfileFrame';
import { CoinIcon, CoinBadge } from '../components/CoinIcon';

import { CONFIG } from '../utils/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

export const PRODUCTION_SKILLS = [
   // 🎬 Video & Film
   "Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Final Cut Pro", "Color Grading", 
   "Video Editing", "Motion Graphics", "Cinematography", "Directing", "Scriptwriting", 
   "Sound Design", "Audio Mixing", "Visual Effects (VFX)", "3D Animation", "Drone Pilot",
   
   // 📷 Photography
   "Adobe Photoshop", "Adobe Lightroom", "Photography", "Studio Photography", "Portrait Photography", 
   "Product Photography", "Event Photography", "Retouching",

   // 🎨 Design & Digital
   "Adobe Illustrator", "InDesign", "Graphic Design", "UI/UX Design", "Figma", "Canva", 
   "Logo Design", "Branding", "Social Media Content", "Digital Artist", "Web Development", "2D Animation",

   // 🏗️ 3D & Tech
   "Blender", "Cinema 4D", "Unreal Engine", "Unity", "3ds Max", "Maya", "3D Modeling", "VFX",
   
   // 🛠️ Production & Technical
   "Camera Operation", "Lighting Design", "Gaffer", "Grip", "Production Manager", 
   "Live Streaming", "OBS Studio", "Technical Director", "Gimbal Operation", "Storyboard Artist",

   // ✍️ Marketing & Others
   "Copywriting", "Content Marketing", "SEO", "Translation", "Voice Over", "Music Production"
];

function UserProfile() {
   const { userId } = useParams();
   const navigate = useNavigate();
   const { user: contextUser, token: contextToken, fetchProfile: refreshContext, updateUser } = useContext(AuthContext);

   const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
   const currentUser = contextUser || JSON.parse(localStorage.getItem('userInfo') || '{}');

   const targetId = userId || currentUser?._id || currentUser?.id;
   const isMyProfile = currentUser?._id === targetId || currentUser?.id === targetId;

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
   const [genderText, setGenderText] = useState('None');
   const [experience, setExperience] = useState([]);
   const [skills, setSkills] = useState([]);

   const [servicePackages, setServicePackages] = useState([]);
   const [showPkgModal, setShowPkgModal] = useState(false);
   const [pkgEditingIndex, setPkgEditingIndex] = useState(null);
   const [pkgForm, setPkgForm] = useState({ title: '', price: '', deliveryTime: '', description: '', features: '' });
   const [activeTab, setActiveTab] = useState('portfolio');
   const [friendRequests, setFriendRequests] = useState([]);
   const [rankProgress, setRankProgress] = useState(null);
   const [showHireModal, setShowHireModal] = useState(false);
   const [selectedPackage, setSelectedPackage] = useState(null);
   const location = useLocation();

   const fileInputRef = useRef(null);
   const coverInputRef = useRef(null);
   const [coverLoading, setCoverLoading] = useState(false);
   const [avatarLoading, setAvatarLoading] = useState(false);
   const [imageToCrop, setImageToCrop] = useState(null);
   const [cropConfig, setCropConfig] = useState({ aspect: 1, type: 'profile' });

   const { socket } = useSocket();
   const [isOnline, setIsOnline] = useState(false);
   const [lastSeen, setLastSeen] = useState(null);

   useEffect(() => {
      if (profile) {
         setIsOnline(profile.isOnline);
         setLastSeen(profile.lastSeen);
      }
   }, [profile]);

   useEffect(() => {
      if (!socket || !targetId) return;
      const handleStatusChange = (data) => {
         if (data.userId === targetId) {
            setIsOnline(data.isOnline);
            if (data.lastSeen) setLastSeen(data.lastSeen);
         }
      };
      socket.on('status_change', handleStatusChange);
      return () => socket.off('status_change', handleStatusChange);
   }, [socket, targetId]);

   useEffect(() => {
      const fetchData = async () => {
         if (!targetId) return;
         setLoading(true);
         try {
            const data = await usersAPI.getPublicProfile(targetId);
            setProfile(data.user);
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

            const wRes = await worksAPI.getByUser(targetId);
            setWorks(wRes.works || []);

            if (currentToken && !isMyProfile) {
               const statusRes = await usersAPI.getFriendStatus(targetId, currentToken);
               setFriendStatus(statusRes.status);
            }

            if (currentToken && isMyProfile) {
               const rankRes = await axios.get(`${API_BASE_URL}/api/users/me/rank-progress`, { headers: { Authorization: `Bearer ${currentToken}` } });
               setRankProgress(rankRes.data);
               const reqs = await usersAPI.getMyFriendRequests(currentToken);
               setFriendRequests(reqs);
            }
         } catch (err) { console.error('Profile fetch failed', err); }
         finally { setLoading(false); setWorksLoading(false); }
      };
      fetchData();
      window.scrollTo(0, 0);
   }, [targetId, currentToken]);

   const handleFriendAction = async () => {
      if (!currentToken) return alert('กรุณาเข้าสู่ระบบก่อนครับ');
      setFriendLoading(true);
      try {
         if (friendStatus === 'none') {
            await usersAPI.sendFriendRequest(targetId, currentToken);
            setFriendStatus('pending_sent');
         } else if (friendStatus === 'pending_sent') {
            await usersAPI.cancelFriendRequest(targetId, currentToken);
            setFriendStatus('none');
         } else if (friendStatus === 'pending_received') {
            await usersAPI.respondFriendRequest(targetId, 'accept', currentToken);
            setFriendStatus('friends');
            setProfile(p => ({ ...p, friends: [...(p.friends || []), { _id: currentUser._id, name: currentUser.name }] }));
         } else if (friendStatus === 'friends') {
            if (!window.confirm(`ยกเลิกเพื่อนกับ ${profile?.name}?`)) return;
            await usersAPI.removeFriend(targetId, currentToken);
            setFriendStatus('none');
         }
      } catch { alert('Operation failed.'); }
      finally { setFriendLoading(false); }
   };

   const handlePackageSubmit = () => {
      if (!pkgForm.title || !pkgForm.price) return alert('โปรดกรอกชื่อและราคาแพ็กเกจ');
      const newPkg = { ...pkgForm, features: pkgForm.features.split(',').map(f => f.trim()).filter(Boolean) };
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
      setPkgForm({ ...pkg, features: pkg.features.join(', ') });
      setPkgEditingIndex(index);
      setShowPkgModal(true);
   };

   const handleDeletePackage = (index) => {
      if (window.confirm('ยืนยันหน้าการลบแพ็กเกจนี้?')) {
         setServicePackages(servicePackages.filter((_, i) => i !== index));
      }
   };

   const handleSaveProfile = async () => {
      try {
         const parsedTags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
         const updatePayload = {
            name: nameText,
            bio: bioText,
            profession: professionText,
            isAvailableForHire: isAvailable,
            serviceTags: parsedTags,
            username: usernameText,
            phone: phoneText,
            address: addressText,
            birthday: birthdayText,
            gender: genderText,
            experience: experience,
            skills: skills,
            servicePackages: servicePackages
         };
         await usersAPI.updateProfile(updatePayload, currentToken);
         setProfile(p => ({ ...p, ...updatePayload }));
         if (updateUser) updateUser(updatePayload);
         if (refreshContext) refreshContext();
         setEditingProfile(false);
      } catch { alert('Profile update failed.'); }
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
         } catch { alert('Image upload failed.'); }
         finally { setAvatarLoading(false); }
      } else {
         setCoverLoading(true);
         try {
            const res = await usersAPI.updateCoverImage(formData, currentToken);
            setProfile(p => ({ ...p, coverImage: res.coverImage }));
            if (updateUser) updateUser({ coverImage: res.coverImage });
            if (refreshContext) refreshContext();
         } catch { alert('Cover upload failed.'); }
         finally { setCoverLoading(false); }
      }
   };



   const handleStartChat = async () => {
      if (!currentToken) return alert('กรุณาเข้าสู่ระบบก่อนครับ');
      try {
         await chatAPI.getOrCreateConversation(targetId, currentToken);
         navigate('/messenger');
      } catch { alert('Secure connection failed.'); }
   };

   if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px' }}>
         <motion.div animate={{ rotate: 360, borderColor: ['#ff5733', '#6366f1', '#ff5733'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ width: '50px', height: '50px', border: '4px solid #ff5733', borderTopColor: 'transparent', borderRadius: '50%' }} />
         <span style={{ color: '#fff', fontWeight: '700', letterSpacing: '2px', fontSize: '0.85rem' }}>SYNCING IDENTITY DATA...</span>
      </div>
   );

   if (!profile) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px' }}>
         <FiUserX size={60} color="#333" />
         <span style={{ color: '#fff', fontWeight: '700', letterSpacing: '2px', fontSize: '0.85rem' }}>IDENTITY NOT FOUND OR CONNECTION ERROR</span>
         <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '20px' }}>RETRY CONNECTION</button>
      </div>
   );

   const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
   const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

   return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ minHeight: '100vh', background: '#050505', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
         <Helmet>
            <title>{profile?.name} | {profile?.profession || 'Freelancer'} | Pattayapal Portfolio</title>
            <meta name="description" content={profile?.bio || `ชมผลงานและทักษะของ ${profile?.name} บนแพลตฟอร์ม Pattayapal`} />

            {/* OpenGraph */}
            <meta property="og:title" content={`${profile?.name} | ${profile?.profession || 'Freelancer'} | Pattayapal`} />
            <meta property="og:description" content={profile?.bio || `Portfolio ของ ${profile?.name}`} />
            {profile?.profileImage?.url && <meta property="og:image" content={getFullUrl(profile.profileImage.url)} />}
         </Helmet>

         {/* 🔮 Background Glow Effects */}
         <div style={{ position: 'fixed', top: '10%', left: '5%', width: '400px', height: '400px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.05, pointerEvents: 'none' }} />
         <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '500px', height: '500px', background: 'var(--indigo)', filter: 'blur(180px)', opacity: 0.05, pointerEvents: 'none' }} />

         {/* ── HERO SECTION ── */}
         <div style={{ width: '100%', height: '400px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: profile.coverImage?.url ? `url(${getFullUrl(profile.coverImage.url)}) center/cover` : 'linear-gradient(45deg, #111, #222)', filter: 'brightness(0.7)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #050505 100%)' }} />


         </div>

         {/* ── MAIN CONTAINER ── */}
         <div className="profile-main-container" style={{ position: 'relative', zIndex: 2 }}>

            {/* IDENTITY HEADER BLOCK */}
            <div className="profile-header-grid" style={{ gap: '30px', alignItems: 'flex-end', marginBottom: '50px' }}>
               <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative' }}>
                     <div style={{ width: '220px', height: '220px', borderRadius: '30px', border: '5px solid #050505', overflow: 'hidden', background: '#222', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {profile.profileImage?.url || (typeof profile.profileImage === 'string' && profile.profileImage) ? (
                           <img 
                              src={getFullUrl(profile.profileImage.url || profile.profileImage)} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                           />
                        ) : null}
                        <div style={{ display: (profile.profileImage?.url || typeof profile.profileImage === 'string') ? 'none' : 'flex', fontSize: '5rem', fontWeight: '700', color: '#444' }}>
                           {(profile.name || 'U')[0]}
                        </div>

                        {isMyProfile && (
                           <div onClick={() => fileInputRef.current.click()} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', opacity: 0, cursor: 'pointer', transition: '0.3s', zIndex: 10 }} className="av-up">
                              <FiCamera size={40} />
                           </div>
                        )}
                        <style>{`.av-up:hover { opacity: 1 !important; }`}</style>
                     </div>
                     {profile.isOnline && <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '25px', height: '25px', background: '#10b981', borderRadius: '50%', border: '4px solid #050505', boxShadow: '0 0 20px #10b981' }} />}
                  </div>

                  <div style={{ paddingBottom: '20px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '700', margin: 0, letterSpacing: '-2px' }}>{profile.name}</h1>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                        <span style={{ fontSize: '1.2rem', color: '#666', fontWeight: '500' }}>@{profile.username || 'identity_pending'}</span>
                        <span style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: '700', background: 'rgba(255,87,51,0.1)', padding: '5px 15px', borderRadius: '10px' }}>{profile.profession || 'GEN-CIVILIAN'}</span>
                     </div>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '15px', paddingBottom: '20px' }}>
                  {!isMyProfile ? (
                     <>
                        <button onClick={handleStartChat} style={{ background: '#fff', color: '#000', border: 'none', padding: '18px 30px', borderRadius: '20px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>SEND MESSAGE</button>
                        <button onClick={handleFriendAction} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px 30px', borderRadius: '20px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                           {friendStatus === 'friends' ? <FiUserCheck /> : (friendStatus === 'pending_sent' ? <FiClock /> : <FiUserPlus />)} {friendStatus === 'friends' ? 'CONNECTED' : (friendStatus === 'pending_sent' ? 'PENDING' : 'CONNECT')}
                        </button>
                     </>
                  ) : (
                     <>
                        <button onClick={() => coverInputRef.current.click()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px 30px', borderRadius: '20px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                           <FiCamera style={{ marginRight: '10px' }} /> BACKGROUND
                        </button>
                        <button onClick={() => setEditingProfile(true)} className="glass" style={{ padding: '18px 40px', borderRadius: '20px', color: '#fff', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                           EDIT IDENTITY
                        </button>
                     </>
                  )}
               </div>
            </div>

            {/* BENTO GRID LAYOUT */}
            <div className="profile-content-grid" style={{ gap: '30px' }}>

               {/* LEFT COLUMN: INFO BLOCKS */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', minWidth: 0 }}>

                  {/* 🛡️ RANK & PROGRESS CARD [PREMIUM] */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '2px' }}>IDENTITY RANK</label>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent)' }}>XP: {(profile.points || 0).toLocaleString()}</div>
                     </div>

                     <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <div style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.05))' }}>
                           <RankBadge rank={profile.rank} size="xl" showName={false} />
                        </div>
                        <div>
                           <h4 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>{profile.rank}</h4>
                           {/* <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '700', marginTop: '5px' }}>LEVEL {profile.level} USER</div> */}
                        </div>
                     </div>

                     {rankProgress && (
                        <div style={{ marginTop: '30px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: '700', color: '#444', marginBottom: '10px' }}>
                              <span>NEXT: {rankProgress.nextRank?.toUpperCase() || 'MAX'}</span>
                              <span>{rankProgress.currentPoints} / {rankProgress.currentPoints + rankProgress.pointsToNext} XP ({Math.round(rankProgress.progress || 0)}%)</span>
                           </div>
                           <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${rankProgress.progress || 0}%` }}
                                 transition={{ duration: 1, ease: "easeOut" }}
                                 style={{ height: '100%', background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)' }}
                              />
                           </div>
                        </div>
                     )}
                  </motion.div>

                  {/* BIO BLOCK */}
                  <div className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: '#555', letterSpacing: '2px', marginBottom: '20px' }}>BIOGRAPHY</h4>
                     <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#aaa', margin: 0 }}>{profile.bio || 'Identity bio data not established.'}</p>
                  </div>

                  {/* DETAILS BLOCK */}
                  <div className="glass" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: '#555', letterSpacing: '2px', marginBottom: '25px' }}>DETAILS & ADDRESS</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><FiMapPin /></div>
                           <div>
                              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>ADDRESS</div>
                              <div style={{ fontSize: '1rem', fontWeight: '600' }}>{profile.address || 'Unknown'}</div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--indigo)' }}><FiCalendar /></div>
                           <div>
                              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>MEMBER SINCE</div>
                              <div style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(profile.createdAt).toLocaleDateString()}</div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                           <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><FiGlobe /></div>
                           <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700' }}>PERSONAL SITE</div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--indigo)', wordBreak: 'break-all' }}>pattaya-pal.com/{profile.username}</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* STATS BLOCK */}
                  <div className="glass profile-stats-grid" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
                     <div>
                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700', marginBottom: '5px' }}>FOLLOWERS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{profile.friends?.length || 0}</div>
                     </div>
                     <div>
                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: '700', marginBottom: '5px' }}>POINTS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--indigo)' }}>{(profile.points || 0).toLocaleString()}</div>
                     </div>
                  </div>

               </div>

               {/* RIGHT COLUMN: MAIN CONTENT FEED & TABS */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                  {/* TABS CONTAINER */}
                  <div className="glass" style={{ padding: '10px', borderRadius: '25px', display: 'flex', gap: '10px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                     {[
                        { id: 'portfolio', label: 'TIMELINE', icon: <FiActivity /> },
                        { id: 'packages', label: 'PACKAGES', icon: <FiZap /> },
                        { id: 'about', label: 'EXPERIENCE', icon: <FiAward /> }
                     ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? 'var(--accent)' : 'transparent', border: 'none', padding: '12px 25px', borderRadius: '18px', color: activeTab === tab.id ? '#fff' : '#666', fontWeight: '700', cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                           {tab.icon} {tab.label}
                        </button>
                     ))}
                  </div>

                  {/* TAB CONTENT BLOCK */}
                  <div className="glass" style={{ minHeight: '600px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                     <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ padding: '40px' }}>

                           {activeTab === 'portfolio' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '30px' }}>
                                 {works.length > 0 ? works.map(w => (
                                    <motion.div whileHover={{ y: -10 }} key={w._id} onClick={() => navigate(`/works/${w._id}`)} style={{ cursor: 'pointer', borderRadius: '30px', overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                       <div style={{ height: '240px', overflow: 'hidden', position: 'relative', background: '#111' }}>
                                          {w.type === 'video' ? (
                                             <>
                                                {w.mainImage?.url && !isVideoUrl(w.mainImage.url) ? (
                                                   <img src={getFullUrl(w.mainImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (w.mainImage?.url || w.mediaUrl) ? (
                                                   <video src={getFullUrl(w.mainImage?.url || w.mediaUrl)} muted preload="metadata" autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                   <div style={{ width: '100%', height: '100%', background: '#0a0a0a' }} />
                                                )}
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                   <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,87,51,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px var(--accent-glow)', backdropFilter: 'blur(4px)' }}>
                                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                                                   </div>
                                                </div>
                                             </>
                                          ) : w.mainImage?.url ? (
                                             <img src={getFullUrl(w.mainImage.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                             <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#222', fontSize: '0.65rem', letterSpacing: '3px' }}>NO PREVIEW</div>
                                          )}
                                       </div>
                                       <div style={{ padding: '25px' }}>
                                          <h4 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: '#fff' }}>{w.title}</h4>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                             <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent)' }}>{w.category?.name}</span>
                                             <span style={{ fontSize: '0.75rem', color: '#444' }}>{new Date(w.createdAt).getFullYear()}</span>
                                          </div>
                                       </div>
                                    </motion.div>
                                 )) : (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#444', fontWeight: '700', letterSpacing: '4px' }}>NO TIMELINE DATA</div>
                                 )}
                              </div>
                           )}

                           {activeTab === 'packages' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: '30px' }}>
                                 {profile.servicePackages?.map((pkg, i) => (
                                    <div key={i} className="glass" style={{ padding: '40px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                       <div style={{
                                          position: 'absolute', top: 0, right: 0, padding: '15px 25px',
                                          background: 'var(--accent)', color: '#fff', fontWeight: '700',
                                          borderBottomLeftRadius: '25px', fontSize: '1.4rem',
                                          display: 'flex', alignItems: 'center', gap: '8px',
                                          boxShadow: '-5px 5px 20px rgba(0,0,0,0.3)'
                                       }}>
                                          <CoinIcon size={24} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                          {Number(pkg.price).toLocaleString()}
                                       </div>
                                       <h4 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '15px', color: '#fff' }}>{pkg.title}</h4>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666', marginBottom: '25px', fontSize: '0.9rem' }}><FiClock /> <span>{pkg.deliveryTime} DAYS DELIVERY</span></div>
                                       <p style={{ color: '#888', lineHeight: '1.6', marginBottom: '30px' }}>{pkg.description}</p>
                                       <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px' }}>
                                          <button 
                                             onClick={() => { setSelectedPackage(pkg); setShowHireModal(true); }}
                                             style={{ width: '100%', padding: '18px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                                          >
                                             REQUEST BOOKING
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}

                           {activeTab === 'about' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                                 {/* EXPERIENCE TIMELINE */}
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    {experience.length > 0 ? experience.map((exp, i) => (
                                       <div key={i} style={{ display: 'flex', gap: '30px', position: 'relative' }}>
                                          {/* Dot & Line */}
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                             <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', boxSizing: 'border-box', border: '4px solid #050505', zIndex: 2 }} />
                                             {i !== experience.length - 1 && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.05)', marginTop: '0px' }} />}
                                          </div>
                                          {/* Content */}
                                          <div style={{ paddingBottom: '40px' }}>
                                             <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '5px' }}>{exp.duration}</div>
                                             <h4 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 5px', color: '#fff' }}>{exp.role}</h4>
                                             <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#666', marginBottom: '15px' }}>{exp.company}</div>
                                             <p style={{ color: '#888', lineHeight: '1.6', margin: 0, fontSize: '0.95rem', maxWidth: '800px' }}>{exp.description}</p>
                                          </div>
                                       </div>
                                    )) : (
                                       <div style={{ padding: '60px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.03)', borderRadius: '30px' }}>
                                          <FiAward size={40} style={{ color: '#222', marginBottom: '15px' }} />
                                          <div style={{ color: '#444', fontWeight: '700', letterSpacing: '2px' }}>PROFESSIONAL HISTORY NOT RECORDED</div>
                                       </div>
                                    )}
                                 </div>

                                 {/* PERSONAL DATA & TAGS (Small Grid below) */}
                                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
                                    <div className="glass" style={{ padding: '30px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                       <h5 style={{ color: '#555', margin: '0 0 15px', letterSpacing: '1px', fontSize: '0.7rem', fontWeight: '700' }}>PERSONAL DATA</h5>
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span style={{ color: '#666' }}>BORN</span> <span>{profile.birthday ? new Date(profile.birthday).toLocaleDateString() : '--'}</span></div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span style={{ color: '#666' }}>GENDER</span> <span>{profile.gender || 'UNDEFINED'}</span></div>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span style={{ color: '#666' }}>ROLE</span> <span>{profile.profession || 'GEN-USER'}</span></div>
                                       </div>
                                    </div>
                                    <div className="glass" style={{ padding: '30px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                       <h5 style={{ color: '#555', margin: '0 0 15px', letterSpacing: '1px', fontSize: '0.7rem', fontWeight: '700' }}>SKILLS & PROFICIENCY</h5>
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                                          {profile.skills?.length > 0 ? profile.skills.map((skill, index) => (
                                             <div key={index}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                   <span style={{ fontWeight: '800', color: '#fff' }}>{skill.name}</span>
                                                   <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{skill.level}%</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                   <motion.div
                                                      initial={{ width: 0 }}
                                                      animate={{ width: `${skill.level}%` }}
                                                      transition={{ duration: 1, delay: index * 0.1 }}
                                                      style={{ height: '100%', background: 'linear-gradient(90deg, var(--indigo), var(--accent))', boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' }}
                                                   />
                                                </div>
                                             </div>
                                          )) : (
                                             <div style={{ fontSize: '0.8rem', color: '#333', fontStyle: 'italic' }}>No skills recorded.</div>
                                          )}
                                       </div>

                                       <h5 style={{ color: '#555', margin: '0 0 15px', letterSpacing: '1px', fontSize: '0.7rem', fontWeight: '700' }}>TAGS</h5>
                                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                          {profile.serviceTags?.map(tag => (
                                             <span key={tag} style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--indigo)', fontWeight: '700' }}>#{tag}</span>
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           )}

                        </motion.div>
                     </AnimatePresence>
                  </div>

               </div>

            </div>

         </div>

         {/* ── Overlays & Modals ── */}
         <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => onFileSelect(e, 'profile')} />
         <input type="file" ref={coverInputRef} style={{ display: 'none' }} onChange={e => onFileSelect(e, 'cover')} />

         {showHireModal && <HireModal freelancerId={targetId} freelancerName={profile?.name} currentToken={currentToken} initialData={selectedPackage ? { title: `จ้างงาน: ${selectedPackage.title}`, budget: selectedPackage.price, description: `จ้างงานตามแพ็กเกจ ${selectedPackage.title}` } : null} onClose={() => { setShowHireModal(false); setSelectedPackage(null); }} />}



         {editingProfile && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)' }}>
                  <h3 style={{ margin: '0 0 40px', fontWeight: '700', letterSpacing: '4px', textAlign: 'center', color: '#fff', fontSize: '1.5rem' }}>EDIT IDENTITY RECORD</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                     {/* Name & Handle */}
                     <div className="edit-row-grid" style={{ gap: '25px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>LEGAL NAME</label>
                           <input value={nameText} onChange={e => setNameText(e.target.value)} placeholder="Full Name" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>USERNAME (@handle)</label>
                           <input value={usernameText} onChange={e => setUsernameText(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="username" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                        </div>
                     </div>

                     {/* Bio */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>BIOGRAPHY / PHILOSOPHY</label>
                        <textarea value={bioText} onChange={e => setBioText(e.target.value)} placeholder="Establish your presence..." rows={3} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', resize: 'none', outline: 'none' }} />
                     </div>

                     {/* Contact & Personal */}
                     <div className="edit-row-grid" style={{ gap: '25px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>CONTACT PHONE</label>
                           <input value={phoneText} onChange={e => setPhoneText(e.target.value)} placeholder="+ --- --- ----" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>DATE OF BIRTH</label>
                           <input type="date" value={birthdayText} onChange={e => setBirthdayText(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                        </div>
                     </div>

                     {/* Gender & Profession */}
                     <div className="edit-row-grid" style={{ gap: '25px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>GENDER IDENTITY</label>
                           <select value={genderText} onChange={e => setGenderText(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }}>
                              <option value="None">Prefer not to say</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                           </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>PROFESSIONAL ROLE</label>
                           <select value={professionText} onChange={e => setProfessionText(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }}>
                              <option value="General">General User</option>
                              <option value="Photographer">Photographer</option>
                              <option value="Videographer">Videographer</option>
                              <option value="Editor">Editor</option>
                              <option value="Director">Director</option>
                           </select>
                        </div>
                     </div>

                     {/* Address */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>STREET ADDRESS / CITY</label>
                        <input value={addressText} onChange={e => setAddressText(e.target.value)} placeholder="City, Country" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                     </div>

                     {/* 🔬 SKILLS SECTION [DYNAMIC] */}
                     <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>PROFESSIONAL SKILLS & PROFICIENCY</label>
                           <button
                              onClick={() => setSkills([...skills, { name: '', level: 50 }])}
                              style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', padding: '8px 15px', borderRadius: '10px', color: '#6366f1', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                           >
                              + ADD SKILL
                           </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           {skills.map((skill, index) => (
                              <div key={index} style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                                 <button
                                    onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
                                 >
                                    <FiTrash2 size={16} />
                                 </button>

                                 <div className="edit-skills-grid" style={{ gap: '25px', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                       <input
                                          value={skill.name}
                                          list={`production-skills-${index}`}
                                          onChange={e => {
                                             const newSkills = [...skills];
                                             newSkills[index].name = e.target.value;
                                             setSkills(newSkills);
                                          }}
                                          placeholder="Skill Name (e.g. Photoshop)"
                                          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #222', padding: '10px 0', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%' }}
                                       />
                                       {/* 📋 Per-row Searchable Skills Datalist (Shows only when typing) */}
                                       <datalist id={`production-skills-${index}`}>
                                          {skill.name.length >= 1 && PRODUCTION_SKILLS
                                             .filter(s => s.toLowerCase().includes(skill.name.toLowerCase()))
                                             .map(s => <option key={s} value={s} />)
                                          }
                                       </datalist>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                       <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={skill.level}
                                          onChange={e => {
                                             const newSkills = [...skills];
                                             newSkills[index].level = parseInt(e.target.value);
                                             setSkills(newSkills);
                                          }}
                                          style={{ flex: 1, accentColor: '#6366f1' }}
                                       />
                                       <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6366f1', minWidth: '40px' }}>{skill.level}%</span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                           {skills.length === 0 && (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#222', fontSize: '0.75rem', fontWeight: '700', border: '1px dashed rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                                 NO SKILLS ADDED
                              </div>
                           )}
                        </div>
                     </div>

                     {/* 💼 EXPERIENCE SECTION [DYNAMIC] */}
                     <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>WORK EXPERIENCE HISTORY</label>
                           <button
                              onClick={() => setExperience([...experience, { company: '', role: '', duration: '', description: '' }])}
                              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px 15px', borderRadius: '10px', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                           >
                              + ADD ITEM
                           </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           {experience.map((exp, index) => (
                              <div key={index} style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>
                                 <button
                                    onClick={() => setExperience(experience.filter((_, i) => i !== index))}
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
                                 >
                                    <FiTrash2 size={16} />
                                 </button>

                                 <div className="edit-row-grid" style={{ gap: '15px', marginBottom: '15px' }}>
                                    <input
                                       value={exp.role}
                                       onChange={e => {
                                          const newExp = [...experience];
                                          newExp[index].role = e.target.value;
                                          setExperience(newExp);
                                       }}
                                       placeholder="Role (e.g. Senior Editor)"
                                       style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #222', padding: '10px 0', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
                                    />
                                    <input
                                       value={exp.company}
                                       onChange={e => {
                                          const newExp = [...experience];
                                          newExp[index].company = e.target.value;
                                          setExperience(newExp);
                                       }}
                                       placeholder="Company"
                                       style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #222', padding: '10px 0', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
                                    />
                                 </div>
                                 <input
                                    value={exp.duration}
                                    onChange={e => {
                                       const newExp = [...experience];
                                       newExp[index].duration = e.target.value;
                                       setExperience(newExp);
                                    }}
                                    placeholder="Duration (e.g. 2022 - Present)"
                                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #222', padding: '10px 0', color: '#fff', outline: 'none', fontSize: '0.9rem', width: '100%', marginBottom: '15px' }}
                                 />
                                 <textarea
                                    value={exp.description}
                                    onChange={e => {
                                       const newExp = [...experience];
                                       newExp[index].description = e.target.value;
                                       setExperience(newExp);
                                    }}
                                    placeholder="Description of responsibilities..."
                                    rows={2}
                                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #222', padding: '10px 0', color: '#aaa', outline: 'none', fontSize: '0.85rem', width: '100%', resize: 'none' }}
                                 />
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* 📦 SERVICE PACKAGES [RESTORED] */}
                     <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555', letterSpacing: '1px' }}>FREELANCE SERVICE PACKAGES</label>
                           <button
                              onClick={() => {
                                 setPkgEditingIndex(null);
                                 setPkgForm({ title: '', price: '', deliveryTime: '', description: '', features: '' });
                                 setShowPkgModal(true);
                              }}
                              style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', padding: '8px 15px', borderRadius: '10px', color: '#6366f1', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                           >
                              + CREATE PACKAGE
                           </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                           {servicePackages.map((pkg, index) => (
                              <div key={index} style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div>
                                    <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{pkg.title}</h6>
                                    <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '700', marginTop: '4px' }}>
                                       ฿{Number(pkg.price).toLocaleString()} • {pkg.deliveryTime} Days
                                    </div>
                                 </div>
                                 <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handlePackageEdit(index)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><FiLayers size={18} /></button>
                                    <button onClick={() => handleDeletePackage(index)} style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer' }}><FiTrash2 size={18} /></button>
                                 </div>
                              </div>
                           ))}
                           {servicePackages.length === 0 && (
                              <div style={{ padding: '30px', textAlign: 'center', color: '#222', fontSize: '0.75rem', fontWeight: '700', border: '1px dashed rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                                 NO PACKAGES CREATED
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Availability */}
                     <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0' }}>
                        <input type="checkbox" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} id="avail-check" style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                        <label htmlFor="avail-check" style={{ fontWeight: '700', color: '#aaa', fontSize: '0.9rem', cursor: 'pointer' }}>OPEN FOR PROFESSIONAL ASSIGNMENTS</label>
                     </div>

                     {/* Actions */}
                     <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        <button onClick={handleSaveProfile} style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: '0.3s' }}>SAVE CHANGES</button>
                        <button onClick={() => setEditingProfile(false)} style={{ flex: 0.6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', color: '#666', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>CANCEL</button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}

         {imageToCrop && <ImageCropModal image={imageToCrop} aspect={cropConfig.aspect} title="CROP_IDENTITY_IMAGE" onClose={() => setImageToCrop(null)} onCropComplete={handleCroppedImage} />}

         {/* 📦 PACKAGE FORM MODAL [RESTORED] */}
         <AnimatePresence>
            {showPkgModal && (
               <div className="modal-overlay" style={{ zIndex: 1100 }}>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '40px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '90vh', overflowY: 'auto' }}>
                     <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '30px', letterSpacing: '-1px' }}>{pkgEditingIndex !== null ? 'EDIT PACKAGE' : 'CREATE PACKAGE'}</h3>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555' }}>PACKAGE TITLE</label>
                           <input value={pkgForm.title} onChange={e => setPkgForm({ ...pkgForm, title: e.target.value })} placeholder="e.g. Basic Photo Set" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555' }}>PRICE (COINS)</label>
                              <input type="number" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} placeholder="Price" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555' }}>EST. DAYS</label>
                              <input type="number" value={pkgForm.deliveryTime} onChange={e => setPkgForm({ ...pkgForm, deliveryTime: e.target.value })} placeholder="Days" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', color: '#fff', outline: 'none' }} />
                           </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555' }}>FEATURES (COMMA SEPARATED)</label>
                           <textarea value={pkgForm.features} onChange={e => setPkgForm({ ...pkgForm, features: e.target.value })} placeholder="Feature 1, Feature 2, Feature 3..." rows={2} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', color: '#fff', outline: 'none', resize: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#555' }}>DESCRIPTION</label>
                           <textarea value={pkgForm.description} onChange={e => setPkgForm({ ...pkgForm, description: e.target.value })} placeholder="Tell clients about this package..." rows={4} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', color: '#fff', outline: 'none', resize: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                           <button onClick={handlePackageSubmit} style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer' }}>CONFIRM PACKAGE</button>
                           <button onClick={() => setShowPkgModal(false)} style={{ flex: 0.5, background: 'rgba(255,255,255,0.05)', color: '#666', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '700', cursor: 'pointer' }}>CLOSE</button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         <style>{`
            .profile-header-grid {
               display: grid;
               grid-template-columns: 1fr auto;
            }
            .profile-content-grid {
               display: grid;
               grid-template-columns: 400px 1fr;
            }
            .profile-stats-grid {
               display: grid;
               grid-template-columns: 1fr 1fr;
            }
            .edit-row-grid {
               display: grid;
               grid-template-columns: 1fr 1fr;
            }
            .edit-skills-grid {
               display: grid;
               grid-template-columns: 2fr 3fr;
            }

            @media (max-width: 992px) {
               .profile-header-grid { grid-template-columns: minmax(0, 1fr); text-align: center; justify-items: center; }
               .profile-header-grid > div:first-child { flex-direction: column; align-items: center !important; }
               .profile-header-grid > div:last-child { justify-content: center; flex-wrap: wrap; }
               .profile-content-grid { grid-template-columns: minmax(0, 1fr); }
               .profile-stats-grid { grid-template-columns: minmax(0, 1fr); text-align: center; }
               .edit-row-grid, .edit-skills-grid { grid-template-columns: minmax(0, 1fr); }
            }
            .profile-main-container {
               max-width: 1400px;
               width: 100%;
               margin: -150px auto 0;
               padding: 0 40px 80px;
               box-sizing: border-box;
            }

            @media (max-width: 768px) {
               .profile-main-container {
                  padding: 0 20px 80px;
                  margin-top: -100px;
               }
               .profile-header-grid h1 { font-size: 2.2rem !important; }
               .profile-content-grid { gap: 20px !important; }
               .profile-header-grid > div:first-child { gap: 20px !important; }
               .profile-header-grid img[alt="me"], .profile-header-grid div[style*="width: 220px"] {
                 width: 150px !important; height: 150px !important;
               }
            }
            @media (max-width: 480px) {
               .profile-header-grid h1 { font-size: 1.8rem !important; }
               .profile-header-grid > div:last-child { width: 100%; }
               .profile-header-grid button { width: 100%; padding: 15px !important; font-size: 0.9rem !important; }
               .profile-main-container { padding: 0 15px 60px; margin-top: -60px; }
            }
         `}</style>
      </motion.div>
   );
}

export default UserProfile;
