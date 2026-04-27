import { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import '../css/Messenger.css';
import { 
  FiSend, FiCheck, FiCheckCircle, FiMessageSquare, FiActivity, FiZap, 
  FiMoreVertical, FiArrowLeft, FiAlertTriangle, FiSearch, FiVideo, 
  FiPhone, FiPlus, FiImage, FiMic, FiPaperclip, FiArchive, FiUsers, 
  FiLogOut, FiShoppingBag, FiUserPlus, FiFilter, FiFileText, FiFile,
  FiMusic, FiX, FiPlay, FiDownload, FiMapPin
} from 'react-icons/fi';

const isInsideThailand = (lat, lng) => {
  return lat >= 5.6 && lat <= 20.5 && lng >= 97.3 && lng <= 105.7;
};

const FileIcon = ({ type, name }) => {
  const ext = name.split('.').pop().toLowerCase();
  if (type.startsWith('image/')) return <FiImage />;
  if (type.startsWith('audio/')) return <FiMusic />;
  if (type.startsWith('video/')) return <FiPlay />;
  if (ext === 'pdf') return <FiFileText />;
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return <FiArchive />;
  return <FiFile />;
};

function Messenger() {
  const { conversationId } = useParams();
  const { user: contextUser, token: contextToken, logout, profileUpdateTag } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const currentUser = contextUser || JSON.parse(localStorage.getItem('userInfo'));
  const contextUserId = currentUser?._id || currentUser?.id;

  // 🧪 State Management
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'archive'
  const [activeNav, setActiveNav] = useState('chats'); // 'chats', 'groups', 'marketplace', 'friends'
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null); // {lat, lng}
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { from, name, offer, type }
  const [activeCall, setActiveCall] = useState(null); // { to, name, type, role: 'caller' | 'receiver' }
  const [localStream, setLocalStream] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: userName }
  const [isUploading, setIsUploading] = useState(false);
  
  const scrollRef = useRef();
  const imageInputRef = useRef();
  const fileInputRef = useRef();
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const messageAreaRef = useRef(null);

  // 🟢 Refs สำหรับแก้ปัญหา Stale State ใน Socket
  const activeChatIdRef = useRef(null);
  const activeTabRef = useRef('all');

  const { socket, isUserOnline, refreshOnlineUsers } = useSocket();

  // 🟢 อัปเดต Refs ทุกครั้งที่ State เปลี่ยน
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    activeChatIdRef.current = currentChat ? currentChat._id : null;
    
    // สั่งให้ Socket เข้าห้องแชท (join_room)
    if (socket && currentChat) {
      socket.emit("join_room", currentChat._id);
    }
  }, [currentChat, socket]);

  // 📡 Socket Effects
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      console.log("📥 Socket รับข้อมูลข้อความใหม่:", data);
      
      // แปลงเป็น String เพื่อป้องกันปัญหา Type ไม่ตรงกันระหว่าง ObjectId ฝั่ง DB กับ String
      const currentChatId = String(activeChatIdRef.current);
      const incomingChatId = String(data.conversationId || data.roomId || data.conversation);

      if (currentChatId === incomingChatId) {
        setMessages((prev) => {
          const isDuplicate = prev.some(m => String(m._id) === String(data._id));
          if (isDuplicate) return prev;
          
          if (data.sender !== contextUserId) {
            socket.emit("mark_read", {
              conversationId: data.conversationId || incomingChatId,
              readerId: contextUserId,
              senderId: data.sender
            });
            return [...prev, { ...data, isRead: true }];
          }
          return [...prev, data];
        });
      } else {
        console.log("🛑 ข้อความเข้า แต่ไม่ได้เปิดห้องแชทนี้อยู่");
      }
      fetchConversations(activeTabRef.current);
    };

    const handleMessagesRead = (data) => {
      if (String(activeChatIdRef.current) === String(data.conversationId)) {
        setMessages((prev) => prev.map(m =>
          m.sender !== data.readerId ? { ...m, isRead: true } : m
        ));
      }
      fetchConversations(activeTabRef.current);
    };

    const handleUserTyping = (data) => {
      if (String(activeChatIdRef.current) === String(data.roomId)) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.userName || 'Someone' }));
      }
    };

    const handleUserStopTyping = (data) => {
      if (String(activeChatIdRef.current) === String(data.roomId)) {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[data.userId];
          return newState;
        });
      }
    };

    const handleCallIncoming = (data) => {
      setIncomingCall(data);
    };

    const handleCallEnded = () => {
      setActiveCall(null);
      setIncomingCall(null);
      setLocalStream(prevStream => {
        if (prevStream) prevStream.getTracks().forEach(t => t.stop());
        return null;
      });
    };

    // เปิดรับ Event
    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("call_incoming", handleCallIncoming);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("call_incoming", handleCallIncoming);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket, contextUserId]);

  // 📦 Logic: Fetching Data
  const fetchConversations = async (filterOverride) => {
    try {
      if (!currentToken) return;
      const filterToUse = filterOverride || activeTab;
      const data = await chatAPI.getMyConversations(currentToken, filterToUse);
      setConversations(data);
      setFetchError(false);
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(activeTab);
    if (refreshOnlineUsers) refreshOnlineUsers();
  }, [currentToken, refreshOnlineUsers, activeTab]);

  // 🔗 Auto-select conversation from URL
  useEffect(() => {
    const handleUrlConversation = async () => {
      if (!conversationId || !currentToken) return;

      // 1. Check if already in the current conversations list
      const existing = conversations.find(c => c._id === conversationId);
      if (existing) {
        if (currentChat?._id !== existing._id) setCurrentChat(existing);
        return;
      }

      // 2. If not in list, fetch it directly (handles direct links or new chats)
      try {
        const conv = await chatAPI.getConversation(conversationId, currentToken);
        if (conv) {
          setConversations(prev => {
             // Double check to avoid duplicates during state updates
             if (prev.some(p => p._id === conv._id)) return prev;
             return [conv, ...prev];
          });
          setCurrentChat(conv);
        }
      } catch (err) {
        console.error("Failed to fetch conversation from URL:", err);
      }
    };

    handleUrlConversation();
  }, [conversationId, currentToken, conversations]);

  // 🔍 Filtering Logic
  useEffect(() => {
    let filtered = conversations || [];

    // 1. Filter by Active Tab (All, Unread, Archive)
    if (activeTab === 'archive') {
      filtered = filtered.filter(c => c.myState?.isArchived === true);
    } else {
      filtered = filtered.filter(c => c.myState?.isArchived !== true);

      if (activeTab === 'unread') {
        filtered = filtered.filter(c => 
          c.lastMessage && 
          !c.lastMessage.isRead && 
          c.lastMessage.sender !== contextUserId
        );
      }
    }

    // 2. Filter by Active Nav (Chats vs Groups)
    if (activeNav === 'chats') filtered = filtered.filter(c => !c.isGroup);
    if (activeNav === 'groups') filtered = filtered.filter(c => c.isGroup);

    // 3. Filter by Search
    if (searchQuery) {
      filtered = filtered.filter(c => {
        const friend = c.isGroup ? null : c.participants.find(p => p.user._id !== contextUserId);
        const name = c.isGroup ? c.groupName : (friend?.user.name || "Unknown");
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredConversations(filtered);
  }, [conversations, activeTab, activeNav, searchQuery, contextUserId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat || !currentToken) return;
      try {
        const data = await chatAPI.getMessages(currentChat._id, currentToken);
        setMessages(data);
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };
    fetchMessages();
  }, [currentChat, currentToken]);

  // ✍️ Event Handlers
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !currentChat || !currentToken) return;

    const formData = new FormData();
    formData.append('conversationId', currentChat._id);
    if (newMessage.trim()) formData.append('text', newMessage);
    
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(item => {
        formData.append('attachments', item.file);
      });
    }

    setIsUploading(true);
    try {
      const res = await chatAPI.sendMessage(formData, currentToken);
      if (socket) {
        socket.emit("send_message", { ...res, roomId: currentChat._id });
        socket.emit("stop_typing", { roomId: currentChat._id, userId: contextUserId });
      }
      setMessages([...messages, res]);
      setNewMessage("");
      // Clean up object URLs
      selectedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setSelectedFiles([]);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (id) => {
    setSelectedFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && currentChat) {
      if (e.target.value.length > 0) {
        socket.emit("typing", { roomId: currentChat._id, userId: contextUserId, userName: currentUser?.name });
      } else {
        socket.emit("stop_typing", { roomId: currentChat._id, userId: contextUserId });
      }
    }
  };

  // 📍 LOCATION MAP INITIALIZER
  useEffect(() => {
    if (showLocationPicker && mapContainerRef.current) {
        const timer = setTimeout(() => {
            if (mapInstanceRef.current) return;

            const defaultLat = 13.7563;
            const defaultLng = 100.5018;

            const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            const marker = window.L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
            setPickedLocation({ lat: defaultLat, lng: defaultLng });

            marker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                setPickedLocation({ lat: pos.lat, lng: pos.lng });
            });

            map.on('click', (e) => {
                const pos = e.latlng;
                marker.setLatLng(pos);
                setPickedLocation({ lat: pos.lat, lng: pos.lng });
            });

            mapInstanceRef.current = map;
            markerInstanceRef.current = marker;

            handleGetLocation();
        }, 300);
        return () => clearTimeout(timer);
    } else if (!showLocationPicker && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
    }
  }, [showLocationPicker]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        updateMapPosition(pos.coords.latitude, pos.coords.longitude);
      }, () => {
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data.latitude && data.longitude) {
              updateMapPosition(data.latitude, data.longitude);
            }
          })
          .catch(err => console.error("IP Geo Error:", err));
      });
    }
  };

  const updateMapPosition = (lat, lng) => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerInstanceRef.current.setLatLng([lat, lng]);
      setPickedLocation({ lat, lng });
    }
  };

  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim()) return;
    setIsSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery)}&countrycodes=th&limit=5`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        
        if (isInsideThailand(lat, lng)) {
          updateMapPosition(lat, lng);
        } else {
          alert("Found but outside Thailand boundary.");
        }
      } else {
        alert("Place not found. Try more specific name.");
      }
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!currentChat || !currentToken) return;
    const isArchived = currentChat.myState?.isArchived;
    try {
      await chatAPI.toggleArchive(currentChat._id, !isArchived, currentToken);
      fetchConversations();
      setCurrentChat(null);
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  const startCall = async (type) => {
    if (!currentChat || !socket || currentChat.isGroup) return;
    const recipient = currentChat.participants.find(p => p.user._id !== contextUserId);
    if (!recipient) return;

    setActiveCall({ to: recipient.user._id, name: recipient.user.name, type, role: 'caller' });
    socket.emit("call_user", {
      to: recipient.user._id,
      from: contextUserId,
      name: currentUser?.name,
      type,
      offer: "webrtc_offer_placeholder" 
    });
  };

  const endCall = () => {
    if (activeCall && socket) {
      socket.emit("end_call", { to: activeCall.to });
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  useEffect(() => {
    const container = messageAreaRef.current;
    if (!container) return;

    // Smart Scroll: Only scroll if user is already at the bottom or it's their own message
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
    const lastMessage = messages[messages.length - 1];
    const isMe = lastMessage?.sender === contextUserId;

    if (isAtBottom || isMe) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, contextUserId]);


  if (loading) return (
    <div style={{ background: '#050505', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );

  if (fetchError) return (
    <div style={{ background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
      <FiAlertTriangle size={50} color="var(--accent)" />
      <h2 style={{ letterSpacing: '2px' }}>COM-LINK DISRUPTED</h2>
      <button onClick={() => window.location.reload()} className="btn-premium">RETRY CONNECTION</button>
    </div>
  );

  return (
    <div className={`messenger-root ${currentChat ? 'chat-active' : ''}`}>
       {/* 🧩 PANEL 1: Global Navigation (Far Left) */}
       <div className="nav-panel">
          <div className="nav-top">
             <div className="user-profile-trigger">
                <img src={currentUser?.profileImage?.url ? (getFullUrl(currentUser.profileImage.url) + `?t=${profileUpdateTag}`) : 'https://via.placeholder.com/40'} alt="me" />
                <div className="online-indicator" />
             </div>
             
             <div className="nav-icons-group">
                <button className={`nav-btn ${activeNav === 'chats' ? 'active' : ''}`} onClick={() => setActiveNav('chats')}>
                   <FiMessageSquare />
                </button>
                <button className={`nav-btn ${activeNav === 'groups' ? 'active' : ''}`} onClick={() => setActiveNav('groups')}>
                   <FiUsers />
                </button>
                <button className="nav-btn" onClick={() => window.location.href = '/discovery'}>
                   <FiShoppingBag />
                </button>
                <button className="nav-btn" onClick={() => window.location.href = '/friends'}>
                   <FiUserPlus />
                </button>
             </div>
          </div>
          
          <div className="nav-bottom">
             <button className="nav-btn logout" onClick={logout}>
                <FiLogOut />
             </button>
          </div>
       </div>

       {/* 🧩 PANEL 2: Inbox Feed (Middle) */}
       <div className="inbox-panel">
          <div className="inbox-header">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activeNav === 'chats' ? 'Chats' : 'Groups'}</h2>
                <button className="new-chat-btn"><FiPlus /></button>
             </div>
             
             <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>

             <div className="inbox-tabs">
                <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
                <button className={activeTab === 'unread' ? 'active' : ''} onClick={() => setActiveTab('unread')}>Unread</button>
                <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>Archive</button>
             </div>
          </div>

          <div className="conversation-list">
             {filteredConversations.length === 0 ? (
                <div className="empty-state">No connection found</div>
             ) : (
                filteredConversations.map(conv => {
                   const friend = conv.isGroup ? null : conv.participants.find(p => p.user._id !== contextUserId);
                   const name = conv.isGroup ? conv.groupName : (friend?.user.name || "Unknown");
                   const img = conv.isGroup ? (conv.groupImage?.url || '') : (friend?.user.profileImage?.url || '');
                   const isSelected = currentChat?._id === conv._id;
                   const online = conv.isGroup ? false : isUserOnline(friend?.user._id);

                   return (
                      <div 
                        key={conv._id} 
                        className={`conv-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setCurrentChat(conv)}
                      >
                         <div className="avatar-wrapper">
                            <img src={img ? getFullUrl(img) : 'https://via.placeholder.com/50'} alt="" />
                            {online && <div className="online-dot" />}
                         </div>
                         <div className="conv-info">
                            <div className="conv-name-row">
                               <span className="conv-name">{name}</span>
                               <span className="conv-time">
                                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                               </span>
                            </div>
                            <div className="conv-preview">
                               {conv.lastMessage?.text || "New connection established..."}
                            </div>
                         </div>
                         {(!conv.lastMessage?.isRead && conv.lastMessage?.sender !== contextUserId) && (
                            <div className="unread-indicator">
                               {conv.unreadCount > 0 ? conv.unreadCount : ''}
                            </div>
                         )}
                      </div>
                   )
                })
             )}
          </div>
       </div>

       {/* 🧩 PANEL 3: Active Workspace (Main) */}
       <div className="chat-panel">
          {currentChat ? (
             <>
                <div className="chat-header">
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <button className="mobile-back" onClick={() => setCurrentChat(null)}><FiArrowLeft /></button>
                      <div className="chat-avatar">
                         {(() => {
                           const friend = currentChat.isGroup ? null : currentChat.participants.find(p => p.user._id !== contextUserId);
                           const img = currentChat.isGroup ? (currentChat.groupImage?.url || '') : (friend?.user.profileImage?.url || '');
                           return <img src={img ? getFullUrl(img) : 'https://via.placeholder.com/45'} alt="" />;
                         })()}
                      </div>
                      <div>
                         <div className="chat-title">
                            {currentChat.isGroup ? currentChat.groupName : currentChat.participants.find(p => p.user._id !== contextUserId)?.user.name}
                         </div>
                          <div className="chat-status">
                             {Object.keys(typingUsers).length > 0 
                                ? `${Object.values(typingUsers).join(', ')} is typing...` 
                                : (currentChat.isGroup ? `${currentChat.participants.length} members` : 'Active now')}
                          </div>
                      </div>
                   </div>
                   
                   <div className="chat-actions">
                       <div className="action-menu-container">
                          <button className="icon-action-btn"><FiMoreVertical /></button>
                          <div className="dropdown-content">
                             <button onClick={() => startCall('voice')}>
                                <FiPhone /> Voice Call
                             </button>
                             <button onClick={() => startCall('video')}>
                                <FiVideo /> Video Call
                             </button>
                             <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />
                             <button onClick={handleToggleArchive}>
                                <FiArchive /> {currentChat.myState?.isArchived ? 'Unarchive' : 'Archive'}
                             </button>
                          </div>
                       </div>
                    </div>
                </div>

                 <div 
                   ref={messageAreaRef}
                   className={`message-area ${isDragging ? 'dragging' : ''}`}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                 >
                   {isDragging && (
                      <div className="drag-overlay">
                         <motion.div 
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className="drag-content"
                         >
                            <FiPlus size={50} />
                            <p>DROP FILES TO UPLOAD</p>
                         </motion.div>
                      </div>
                   )}
                   {messages.map((m, i) => {
                      const isMe = m.sender === contextUserId;
                      return (
                         <div key={m._id || i} className={`msg-wrapper ${isMe ? 'me' : 'them'}`}>
                            {!isMe && currentChat.isGroup && (
                               <img src={getFullUrl(m.sender?.profileImage?.url)} className="msg-avatar-small" />
                            )}
                            <div className="msg-bubble">
                               {m.attachments?.length > 0 && (
                                  <div className={`msg-attachments ${m.attachments.length === 1 ? 'single' : ''}`}>
                                     {m.attachments.map((att, idx) => (
                                        <div key={idx} className="msg-att-item">
                                           {att.fileType.startsWith('image/') ? (
                                              <img 
                                                src={getFullUrl(att.url)} 
                                                className="msg-img-preview" 
                                                onClick={() => setPreviewImage(getFullUrl(att.url))} 
                                                alt="attachment"
                                              />
                                           ) : att.fileType.startsWith('audio/') ? (
                                              <audio controls src={getFullUrl(att.url)} className="msg-audio-player" />
                                           ) : (
                                              <a href={getFullUrl(att.url)} target="_blank" rel="noreferrer" className="msg-file-link">
                                                 <div className="file-icon-box">
                                                    <FileIcon type={att.fileType} name={att.fileName || ''} />
                                                 </div>
                                                 <div className="file-details">
                                                    <span className="file-name-text">{att.fileName || 'Attachment'}</span>
                                                    <span className="file-meta-text">
                                                       {att.fileType.split('/').pop()} • {(att.fileSize / 1024).toFixed(1)} KB
                                                    </span>
                                                 </div>
                                              </a>
                                           )}
                                        </div>
                                     ))}
                                  </div>
                               )}
                               {m.messageType === 'location' ? (
                                   <div className="location-card">
                                      <div className="location-map-preview">
                                         <iframe 
                                            width="100%" 
                                            height="100%" 
                                            frameBorder="0" 
                                            style={{ border: 0 }}
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${JSON.parse(m.text).lng-0.005}%2C${JSON.parse(m.text).lat-0.005}%2C${JSON.parse(m.text).lng+0.005}%2C${JSON.parse(m.text).lat+0.005}&layer=mapnik&marker=${JSON.parse(m.text).lat}%2C${JSON.parse(m.text).lng}`}
                                         />
                                      </div>
                                      <div className="location-info">
                                         <FiMapPin size={18} color="var(--accent)" />
                                         <span>แชร์ตำแหน่งที่ตั้ง</span>
                                      </div>
                                      <a 
                                         href={`https://www.google.com/maps?q=${JSON.parse(m.text).lat},${JSON.parse(m.text).lng}`} 
                                         target="_blank" 
                                         rel="noreferrer"
                                         className="location-link"
                                      >
                                         VIEW ON GOOGLE MAPS
                                      </a>
                                   </div>
                                ) : (
                                   m.text && <div className="msg-content">{m.text}</div>
                                )}
                               <div className="msg-meta">
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isMe && (m.isRead ? <FiCheckCircle size={12} style={{ marginLeft: '4px' }} /> : <FiCheck size={12} style={{ marginLeft: '4px' }} />)}
                               </div>
                            </div>
                         </div>
                      )
                   })}
                   <div ref={scrollRef} />
                </div>

                <div className="chat-input-wrapper">
                     <AnimatePresence>
                        {selectedFiles.length > 0 && (
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: 10 }}
                             className="file-previews-container"
                           >
                              {selectedFiles.map((f, i) => (
                                 <motion.div 
                                   layout
                                   key={f.id} 
                                   className="file-preview-card"
                                 >
                                    {f.preview ? (
                                       <img src={f.preview} alt="" />
                                    ) : (
                                       <div className="file-icon-placeholder">
                                          {f.file.type.includes('pdf') ? <FiFileText /> : <FiFile />}
                                       </div>
                                    )}
                                    <div className="file-info-overlay">
                                       <span className="file-name">{f.file.name.split('.').shift()}</span>
                                       <span className="file-ext">{f.file.name.split('.').pop().toUpperCase()}</span>
                                    </div>
                                    <button 
                                      className="remove-file-btn" 
                                      onClick={() => removeSelectedFile(f.id)}
                                    >
                                       <FiX />
                                    </button>
                                 </motion.div>
                              ))}
                           </motion.div>
                        )}
                     </AnimatePresence>
                    <div className="input-actions-left">
                       <input type="file" ref={imageInputRef} hidden accept="image/*" multiple onChange={handleFileSelect} />
                       <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileSelect} />
                       <button className="input-aux-btn" onClick={() => fileInputRef.current.click()}><FiPlus /></button>
                       <button className="input-aux-btn" onClick={() => imageInputRef.current.click()}><FiImage /></button>
                       <button 
                          className="input-aux-btn" 
                          onClick={() => setShowLocationPicker(true)}
                          title="แชร์ตำแหน่ง (เฉพาะประเทศไทย)"
                        >
                          <FiMapPin />
                        </button>
                    </div>
                    
                    <form className="input-form" onSubmit={handleSendMessage}>
                        <textarea 
                           placeholder="Type your message here..." 
                           value={newMessage}
                           rows="1"
                           onChange={(e) => {
                              handleTyping(e);
                              e.target.style.height = 'auto';
                              e.target.style.height = (e.target.scrollHeight) + 'px';
                           }}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSendMessage(e);
                                 e.target.style.height = 'auto';
                              }
                           }}
                        />
                        <div className="input-actions-right">
                           <button type="button" className="input-aux-btn"><FiMic /></button>
                           <button type="submit" className="send-btn" disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading}>
                              {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiZap /></motion.div> : <FiSend />}
                           </button>
                        </div>
                    </form>
                </div>
             </>
          ) : (
             <div className="welcome-chat">
                <FiZap size={60} color="rgba(255,255,255,0.05)" />
                <h3>SELECT A FREELANCE CHANNEL</h3>
                <p>Establishing secure point-to-point connection...</p>
             </div>
          )}
       </div>

       {/* 🧩 CALL OVERLAY */}
       <AnimatePresence>
          {(incomingCall || activeCall) && (
             <motion.div 
               className="call-overlay"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
                <div className="call-card glass">
                   <div className="call-avatar-big">
                      <img src="https://via.placeholder.com/120" alt="" />
                      <div className="pulse-ring" />
                   </div>
                   <h2>{incomingCall ? incomingCall.name : activeCall?.name}</h2>
                   <p>{incomingCall ? `INCOMING ${incomingCall.type.toUpperCase()} CALL` : `CALLING...`}</p>
                   
                   <div className="call-actions-row">
                      {incomingCall ? (
                         <>
                            <button className="call-btn accept" onClick={() => {
                               setActiveCall({ to: incomingCall.from, name: incomingCall.name, type: incomingCall.type, role: 'receiver' });
                               setIncomingCall(null);
                            }}>
                               <FiPhone />
                            </button>
                            <button className="call-btn decline" onClick={() => setIncomingCall(null)}>
                               <FiPhone style={{ transform: 'rotate(135deg)' }} />
                            </button>
                         </>
                      ) : (
                         <button className="call-btn decline" onClick={endCall}>
                            <FiPhone style={{ transform: 'rotate(135deg)' }} />
                         </button>
                      )}
                   </div>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

       {/* 🧩 LOCATION PICKER */}
       <AnimatePresence>
          {showLocationPicker && (
             <motion.div 
               className="call-overlay" 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
             >
                <div className="call-card glass" style={{ width: '500px', padding: '30px', maxWidth: '95vw' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>📍 แชร์ตำแหน่งที่ตั้ง</h3>
                      <button onClick={() => setShowLocationPicker(false)} className="lightbox-close" style={{ position: 'static', width: '35px', height: '35px' }}><FiX /></button>
                   </div>
                   
                   <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '15px', textAlign: 'left', width: '100%' }}>
                      เลือกตำแหน่งที่คุณต้องการแชร์บนแผนที่ (รองรับเฉพาะในประเทศไทยเท่านั้น)
                   </p>

                   <div className="location-search-box" style={{ width: '100%', marginBottom: '15px', position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="ค้นหาชื่อสถานที่..." 
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                      />
                      <button onClick={handleLocationSearch} disabled={isSearchingLocation}>
                        {isSearchingLocation ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiZap size={14} /></motion.div> : <FiSearch />}
                      </button>
                   </div>

                   <div 
                     id="map-picker-container" 
                     ref={mapContainerRef} 
                     style={{ width: '100%', height: '300px', borderRadius: '15px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} 
                   />

                   <div className="location-picker-actions" style={{ marginTop: '20px', width: '100%' }}>
                      <button 
                        className="btn-premium" 
                        style={{ width: '100%', padding: '15px', fontSize: '1rem' }}
                        disabled={!pickedLocation || !isInsideThailand(pickedLocation.lat, pickedLocation.lng)}
                        onClick={() => {
                          if (!isInsideThailand(pickedLocation.lat, pickedLocation.lng)) {
                            return alert("ขออภัย ระบบรองรับเฉพาะการแชร์ตำแหน่งภายในประเทศไทยเท่านั้น");
                          }

                          chatAPI.sendMessage({
                            conversationId: currentChat._id,
                            text: JSON.stringify(pickedLocation),
                            messageType: 'location'
                          }, currentToken).then((m) => {
                            setMessages([...messages, m]);
                            setShowLocationPicker(false);
                            if (socket) {
                              socket.emit("send_message", { ...m, roomId: currentChat._id });
                            }
                          });
                        }}
                      >
                         {pickedLocation && !isInsideThailand(pickedLocation.lat, pickedLocation.lng) 
                           ? "ตำแหน่งอยู่นอกประเทศไทย" 
                           : "ยืนยันการแชร์ตำแหน่งนี้"}
                      </button>
                      
                      <button 
                        onClick={handleGetLocation}
                        style={{ width: '100%', marginTop: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        ดึงตำแหน่งปัจจุบัน
                      </button>
                   </div>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

       {/* 🧩 LIGHTBOX */}
       <AnimatePresence>
          {previewImage && (
            <motion.div 
              className="lightbox-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
            >
              <button className="lightbox-close" onClick={() => setPreviewImage(null)}>
                <FiX size={32} />
              </button>
              
              <motion.div 
                className="lightbox-content"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="lightbox-image-wrapper">
                  <img src={previewImage} alt="Preview" />
                </div>
                
                <div className="lightbox-actions">
                  <a href={previewImage} download target="_blank" rel="noreferrer" className="lightbox-btn">
                    <FiDownload /> Download
                  </a>
                  <button className="lightbox-btn secondary" onClick={() => setPreviewImage(null)}>
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

export default Messenger;