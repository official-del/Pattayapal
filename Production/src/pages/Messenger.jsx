import { useState, useEffect, useContext, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const scrollRef = useRef();
  const imageInputRef = useRef();
  const fileInputRef = useRef();
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const { socket, isUserOnline, refreshOnlineUsers } = useSocket();

  // 📡 Socket Effects
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (data) => {
      if (window.currentChatId === data.conversationId) {
        setMessages((prev) => {
          const isDuplicate = prev.some(m => m._id === data._id);
          if (isDuplicate) return prev;
          
          if (data.sender !== contextUserId) {
            socket.emit("mark_read", {
              conversationId: data.conversationId,
              readerId: contextUserId,
              senderId: data.sender
            });
            return [...prev, { ...data, isRead: true }];
          }
          return [...prev, data];
        });
      }
      fetchConversations();
    });

    socket.on("messages_read", (data) => {
      if (window.currentChatId === data.conversationId) {
        setMessages((prev) => prev.map(m =>
          m.sender !== data.readerId ? { ...m, isRead: true } : m
        ));
      }
      fetchConversations();
    });

    socket.on("user_typing", (data) => {
      if (window.currentChatId === data.roomId) setIsTyping(true);
    });

    socket.on("user_stop_typing", (data) => {
      if (window.currentChatId === data.roomId) setIsTyping(false);
    });

    // 📞 Call Signaling
    socket.on("call_incoming", (data) => {
      setIncomingCall(data);
    });

    socket.on("call_ended", () => {
      setActiveCall(null);
      setIncomingCall(null);
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("messages_read");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("call_incoming");
      socket.off("call_ended");
    };
  }, [socket, contextUserId, localStream]);

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

  // 🔍 Filtering Logic
  useEffect(() => {
    let filtered = conversations;

    // Filter by Active Nav (Chats vs Groups)
    if (activeNav === 'chats') filtered = filtered.filter(c => !c.isGroup);
    if (activeNav === 'groups') filtered = filtered.filter(c => c.isGroup);

    // Filter by Search
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
        window.currentChatId = currentChat._id;
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
      // Clean up object URLs to avoid memory leaks
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
        // ให้ Map โหลดหลัง ModalRender นิดนึง
        const timer = setTimeout(() => {
            if (mapInstanceRef.current) return;

            // พิกัดเริ่มต้น: กรุงเทพฯ
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

            // พยายามดึงพิกัดจริง
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
        // IP Fallback ถ้า GPS โดนบล็อก
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
    // Note: WebRTC peer connection logic would go here
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


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
                            <div className="unread-indicator" />
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
                            {isTyping ? 'typing...' : (currentChat.isGroup ? `${currentChat.participants.length} members` : 'Active now')}
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
                       <input 
                          type="text" 
                          placeholder="Type your message here..." 
                          value={newMessage}
                          onChange={handleTyping}
                       />
                       <div className="input-actions-right">
                          <button type="button" className="input-aux-btn"><FiMic /></button>
                          <button type="submit" className="send-btn" disabled={!newMessage.trim() && selectedFiles.length === 0}><FiSend /></button>
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

       <style>{`
          .messenger-root {
             display: flex;
             height: 100vh;
             background: #050505;
             color: #fff;
             overflow: hidden;
             font-family: var(--font-main);
          }

          /* 🧩 NAV PANEL */
          .nav-panel {
             width: 80px;
             border-right: 1px solid rgba(255,255,255,0.05);
             display: flex;
             flex-direction: column;
             justify-content: space-between;
             align-items: center;
             padding: 30px 0;
             background: rgba(255,255,255,0.01);
          }
          .user-profile-trigger {
             position: relative;
             width: 42px;
             height: 42px;
             margin-bottom: 40px;
          }
          .user-profile-trigger img {
             width: 100%;
             height: 100%;
             border-radius: 12px;
             object-fit: cover;
             border: 2px solid var(--accent);
          }
          .online-indicator {
             position: absolute;
             bottom: -2px;
             right: -2px;
             width: 10px;
             height: 10px;
             background: #22c55e;
             border-radius: 50%;
             border: 2px solid #050505;
          }
          .nav-icons-group {
             display: flex;
             flex-direction: column;
             gap: 20px;
          }
          .nav-btn {
             width: 42px;
             height: 42px;
             border-radius: 12px;
             background: none;
             border: none;
             color: rgba(255,255,255,0.2);
             font-size: 1.3rem;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             transition: 0.3s;
          }
          .nav-btn:hover, .nav-btn.active {
             background: rgba(255, 87, 51, 0.1);
             color: var(--accent);
          }
          .nav-btn.logout {
             margin-top: auto;
          }
          .nav-btn.logout:hover {
             color: #ef4444;
             background: rgba(239, 68, 68, 0.1);
          }

          /* 🧩 INBOX PANEL */
          .inbox-panel {
             width: 360px;
             border-right: 1px solid rgba(255,255,255,0.05);
             display: flex;
             flex-direction: column;
             background: rgba(255,255,255,0.005);
          }
          .inbox-header {
             padding: 25px;
          }
          .new-chat-btn {
             width: 35px;
             height: 35px;
             border-radius: 10px;
             background: rgba(255,255,255,0.05);
             border: 1px solid rgba(255,255,255,0.1);
             color: #fff;
             cursor: pointer;
          }
          .search-wrapper {
             position: relative;
             margin-bottom: 20px;
          }
          .search-icon {
             position: absolute;
             left: 15px;
             top: 50%;
             transform: translateY(-50%);
             color: rgba(255,255,255,0.2);
          }
          .search-wrapper input {
             width: 100%;
             background: rgba(255,255,255,0.03);
             border: 1px solid rgba(255,255,255,0.05);
             border-radius: 12px;
             padding: 12px 15px 12px 45px;
             color: #fff;
             outline: none;
             font-size: 0.9rem;
          }
          .inbox-tabs {
             display: flex;
             gap: 15px;
             border-bottom: 1px solid rgba(255,255,255,0.05);
             padding-bottom: 10px;
          }
          .inbox-tabs button {
             background: none;
             border: none;
             color: rgba(255,255,255,0.3);
             font-weight: 600;
             font-size: 0.85rem;
             cursor: pointer;
             position: relative;
             padding: 5px 0;
          }
          .inbox-tabs button.active {
             color: #fff;
          }
          .inbox-tabs button.active::after {
             content: '';
             position: absolute;
             bottom: -11px;
             left: 0;
             width: 100%;
             height: 2px;
             background: var(--accent);
          }

          .conversation-list {
             flex: 1;
             overflow-y: auto;
             padding: 10px;
          }
          .conversation-list::-webkit-scrollbar { width: 5px; }
          .conversation-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }

          .conv-item {
             display: flex;
             gap: 15px;
             padding: 15px;
             border-radius: 16px;
             cursor: pointer;
             transition: 0.2s;
             margin-bottom: 5px;
             position: relative;
          }
          .conv-item:hover {
             background: rgba(255,255,255,0.02);
          }
          .conv-item.active {
             background: rgba(255, 87, 51, 0.05);
             border: 1px solid rgba(255, 87, 51, 0.1);
          }
          .avatar-wrapper {
             position: relative;
             width: 50px;
             height: 50px;
             flex-shrink: 0;
          }
          .avatar-wrapper img {
             width: 100%;
             height: 100%;
             border-radius: 15px;
             object-fit: cover;
          }
          .online-dot {
             position: absolute;
             bottom: -2px;
             right: -2px;
             width: 12px;
             height: 12px;
             background: #22c55e;
             border-radius: 50%;
             border: 3px solid #050505;
          }
          .conv-info {
             flex: 1;
             min-width: 0;
          }
          .conv-name-row {
             display: flex;
             justify-content: space-between;
             align-items: center;
             margin-bottom: 5px;
          }
          .conv-name {
             font-weight: 700;
             font-size: 0.95rem;
             white-space: nowrap;
             overflow: hidden;
             text-overflow: ellipsis;
          }
          .conv-time {
             font-size: 0.75rem;
             color: rgba(255,255,255,0.2);
          }
          .conv-preview {
             font-size: 0.85rem;
             color: rgba(255,255,255,0.4);
             white-space: nowrap;
             overflow: hidden;
             text-overflow: ellipsis;
          }
          .unread-indicator {
             width: 8px;
             height: 8px;
             background: var(--accent);
             border-radius: 50%;
             position: absolute;
             right: 15px;
             top: 50%;
             transform: translateY(-50%);
             box-shadow: 0 0 10px var(--accent);
          }

          /* 🧩 CHAT PANEL */
          .chat-panel {
             flex: 1;
             display: flex;
             flex-direction: column;
             background: #050505;
             position: relative;
          }
          .chat-header {
             padding: 15px 350px 15px 25px; /* Increased offset to prevent overlap with global floating navbar dock */
             border-bottom: 1px solid rgba(255,255,255,0.05);
             display: flex;
             justify-content: space-between;
             align-items: center;
             background: rgba(5,5,5,0.8);
             backdrop-filter: blur(10px);
             z-index: 100;
          }
          .chat-avatar img {
             width: 45px;
             height: 45px;
             border-radius: 12px;
             object-fit: cover;
          }
          .chat-title {
             font-weight: 800;
             font-size: 1.1rem;
             color: #fff;
          }
          .chat-status {
             font-size: 0.75rem;
             color: #22c55e;
             font-weight: 600;
          }
          .chat-actions {
             display: flex;
             gap: 10px;
          }
          .icon-action-btn {
             width: 40px;
             height: 40px;
             border-radius: 10px;
             background: rgba(255,255,255,0.03);
             border: 1px solid rgba(255,255,255,0.05);
             color: rgba(255,255,255,0.5);
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             transition: 0.3s;
          }
          .icon-action-btn:hover {
             background: rgba(255,255,255,0.08);
             color: #fff;
          }

          .message-area {
             flex: 1;
             overflow-y: auto;
             padding: 30px;
             display: flex;
             flex-direction: column;
             gap: 20px;
             position: relative;
          }
          .message-area::-webkit-scrollbar { width: 5px; }
          .message-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }

          .msg-wrapper {
             display: flex;
             gap: 15px;
             max-width: 70%;
          }
          .msg-wrapper.me {
             align-self: flex-end;
             flex-direction: row-reverse;
          }
          .msg-avatar-small {
             width: 32px;
             height: 32px;
             border-radius: 8px;
             align-self: flex-end;
          }
          .msg-bubble {
             padding: 12px 18px;
             border-radius: 20px;
             position: relative;
             font-size: 0.95rem;
             line-height: 1.5;
          }
          .me .msg-bubble {
             background: var(--accent);
             color: #fff;
             border-bottom-right-radius: 4px;
             box-shadow: 0 10px 20px rgba(255, 87, 51, 0.2);
          }
          .them .msg-bubble {
             background: rgba(255,255,255,0.05);
             color: #fff;
             border-bottom-left-radius: 4px;
             border: 1px solid rgba(255,255,255,0.05);
          }
          .msg-attachments {
             display: grid;
             grid-template-columns: repeat(2, 1fr);
             gap: 10px;
             margin-bottom: 10px;
          }
          .msg-attachments.single {
             grid-template-columns: 1fr;
             max-width: 320px;
          }
          .msg-img-preview {
             width: 100%;
             max-height: 400px;
             object-fit: cover;
             border-radius: 12px;
             cursor: pointer;
             transition: 0.3s;
          }
          .msg-img-preview:hover { filter: brightness(0.9); }
          
          .msg-file-link {
             display: flex;
             align-items: center;
             gap: 12px;
             background: rgba(255,255,255,0.05);
             padding: 10px;
             border-radius: 12px;
             text-decoration: none;
             color: #fff;
             border: 1px solid rgba(255,255,255,0.1);
          }
          .file-icon-box {
             width: 40px;
             height: 40px;
             background: rgba(255,255,255,0.05);
             border-radius: 10px;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: 1.2rem;
             color: var(--accent);
          }
          .file-details {
             display: flex;
             flex-direction: column;
             min-width: 0;
          }
          .file-name-text {
             font-weight: 700;
             font-size: 0.85rem;
             white-space: nowrap;
             overflow: hidden;
             text-overflow: ellipsis;
          }
          .file-meta-text {
             font-size: 0.7rem;
             opacity: 0.5;
          }

          .msg-meta {
             display: flex;
             align-items: center;
             justify-content: flex-end;
             gap: 5px;
             font-size: 0.65rem;
             margin-top: 5px;
             opacity: 0.6;
          }

          /* 🧩 INPUT AREA */
          .chat-input-wrapper {
             padding: 20px 25px;
             background: #050505;
             border-top: 1px solid rgba(255,255,255,0.05);
             display: flex;
             flex-direction: column;
             gap: 15px;
          }
          .file-previews-container {
             display: flex;
             gap: 15px;
             padding-bottom: 5px;
             overflow-x: auto;
          }
          .file-preview-card {
             width: 80px;
             height: 80px;
             border-radius: 12px;
             overflow: hidden;
             position: relative;
             flex-shrink: 0;
             border: 1px solid rgba(255,255,255,0.1);
          }
          .file-preview-card img {
             width: 100%;
             height: 100%;
             object-fit: cover;
          }
          .file-icon-placeholder {
             width: 100%;
             height: 100%;
             background: #111;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: 1.5rem;
             color: var(--accent);
          }
          .remove-file-btn {
             position: absolute;
             top: 5px;
             right: 5px;
             width: 20px;
             height: 20px;
             background: rgba(0,0,0,0.5);
             border: none;
             border-radius: 4px;
             color: #fff;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             font-size: 0.8rem;
          }

          .dragging {
             border: 2px dashed var(--accent) !important;
             background: rgba(255, 87, 51, 0.05) !important;
          }
          .drag-overlay {
             position: absolute;
             inset: 0;
             background: rgba(0, 0, 0, 0.6);
             backdrop-filter: blur(8px);
             z-index: 1000;
             display: flex;
             align-items: center;
             justify-content: center;
             pointer-events: none;
          }
          .drag-content {
             display: flex;
             flex-direction: column;
             align-items: center;
             gap: 15px;
             color: var(--accent);
             font-weight: 800;
             letter-spacing: 2px;
          }
          .input-actions-left {
             display: flex;
             gap: 10px;
          }
          .input-form {
             flex: 1;
             display: flex;
             align-items: center;
             background: rgba(255,255,255,0.03);
             border-radius: 16px;
             padding: 5px 5px 5px 20px;
             border: 1px solid rgba(255,255,255,0.1);
          }
          .input-form input {
             flex: 1;
             background: none;
             border: none;
             color: #fff;
             outline: none;
             padding: 12px 0;
             font-size: 0.95rem;
          }
          .input-aux-btn {
             background: none;
             border: none;
             color: rgba(255,255,255,0.2);
             font-size: 1.2rem;
             cursor: pointer;
             padding: 8px;
             transition: 0.3s;
          }
          .input-aux-btn:hover {
             color: var(--accent);
          }
          .send-btn {
             width: 45px;
             height: 45px;
             background: var(--accent);
             border: none;
             border-radius: 12px;
             color: #fff;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             transition: 0.3s;
          }
          .send-btn:disabled {
             opacity: 0.3;
             cursor: not-allowed;
          }

          .welcome-chat {
             flex: 1;
             display: flex;
             flex-direction: column;
             align-items: center;
             justify-content: center;
             background: radial-gradient(circle at center, rgba(255, 87, 51, 0.03) 0%, transparent 70%);
          }
          .welcome-chat h3 {
             margin-top: 20px;
             letter-spacing: 5px;
             font-weight: 800;
             color: rgba(255,255,255,0.1);
          }
          .welcome-chat p {
             font-size: 0.8rem;
             color: rgba(255,255,255,0.05);
             margin-top: 10px;
          }

          /* 🧩 CALL SYSTEM */
          .call-overlay {
             position: fixed;
             top: 0;
             left: 0;
             width: 100%;
             height: 100vh;
             background: rgba(0,0,0,0.9);
             z-index: 9999;
             display: flex;
             align-items: center;
             justify-content: center;
             backdrop-filter: blur(20px);
          }
          .call-card {
             width: 100%;
             max-width: 400px;
             padding: 60px 40px;
             border-radius: 40px;
             text-align: center;
             display: flex;
             flex-direction: column;
             align-items: center;
             gap: 20px;
          }
          .call-avatar-big {
             position: relative;
             width: 120px;
             height: 120px;
             margin-bottom: 20px;
          }
          .call-avatar-big img {
             width: 100%;
             height: 100%;
             border-radius: 40px;
             object-fit: cover;
             border: 3px solid var(--accent);
          }
          .pulse-ring {
             position: absolute;
             top: -10%;
             left: -10%;
             width: 120%;
             height: 120%;
             border: 2px solid var(--accent);
             border-radius: 45px;
             animation: pulseRing 2s infinite;
          }
          @keyframes pulseRing {
             0% { transform: scale(0.9); opacity: 0.8; }
             100% { transform: scale(1.3); opacity: 0; }
          }
          .call-actions-row {
             display: flex;
             gap: 30px;
             margin-top: 20px;
          }
          .call-btn {
             width: 60px;
             height: 60px;
             border-radius: 50%;
             border: none;
             color: #fff;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
             transition: 0.3s;
             font-size: 1.5rem;
          }
          .call-btn.accept { background: #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
          .call-btn.decline { background: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
          .call-btn:hover { transform: scale(1.1); }

          .action-menu-container {
             position: relative;
          }
          .dropdown-content {
             display: none;
             position: absolute;
             right: 0;
             top: 100%;
             background: #111;
             border: 1px solid rgba(255,255,255,0.1);
             border-radius: 12px;
             min-width: 150px;
             z-index: 10;
             overflow: hidden;
          }
          .action-menu-container:hover .dropdown-content {
             display: block;
          }
          .dropdown-content button {
             width: 100%;
             padding: 12px 15px;
             background: none;
             border: none;
             color: rgba(255,255,255,0.6);
             text-align: left;
             cursor: pointer;
             display: flex;
             align-items: center;
             gap: 10px;
             transition: 0.2s;
          }
          .dropdown-content button:hover {
             background: rgba(255,255,255,0.05);
             color: #fff;
          }

          .mobile-back { display: none; }

          @media (max-width: 1024px) {
             .inbox-panel { width: 300px; }
             .chat-header { padding: 15px 80px 15px 25px; } /* Adjust for mobile menu */
          }
          @media (max-width: 768px) {
             .nav-panel { display: none; }
             .inbox-panel { width: 100%; border-right: none; }
             .chat-panel { display: none; }
             .chat-active .inbox-panel { display: none; }
             .chat-active .chat-panel { display: flex; width: 100%; }
             .mobile-back { display: block; border: none; background: none; color: #fff; margin-right: 10px; }
             .chat-header { padding: 15px 60px 15px 15px; } /* Account for mobile hamburger */
          }
           .lightbox-overlay {
             position: fixed;
             top: 0; left: 0; 
             width: 100%; height: 100vh;
             background: rgba(0,0,0,0.92);
             backdrop-filter: blur(15px);
             z-index: 10000;
             display: flex;
             align-items: center;
             justify-content: center;
             padding: 20px;
             cursor: zoom-out;
           }
           .lightbox-close {
             position: absolute;
             top: 40px; right: 40px;
             background: rgba(255,255,255,0.05);
             border: 1px solid rgba(255,255,255,0.1);
             width: 50px; height: 50px;
             border-radius: 15px;
             color: white; cursor: pointer;
             display: flex; align-items: center; justify-content: center;
             transition: 0.3s; z-index: 10001;
           }
           .lightbox-close:hover { 
             background: var(--accent); 
             transform: rotate(90deg);
             box-shadow: 0 0 20px var(--accent);
           }
           .lightbox-content {
             width: 100%; height: 100%;
             display: flex; flex-direction: column;
             gap: 25px; align-items: center; justify-content: center;
             cursor: default;
           }
           .lightbox-image-wrapper {
             position: relative;
             display: flex; align-items: center; justify-content: center;
             max-width: 90vw; max-height: 85vh;
           }
           .lightbox-content img {
             max-width: 100%; max-height: 80vh;
             object-fit: contain;
             border-radius: 16px;
             box-shadow: 0 30px 60px rgba(0,0,0,0.8);
             border: 1px solid rgba(255,255,255,0.1);
           }
           .lightbox-actions {
             display: flex; gap: 20px;
             background: rgba(0,0,0,0.4);
             padding: 10px 20px; border-radius: 40px;
             border: 1px solid rgba(255,255,255,0.05);
           }
           .lightbox-btn {
             background: var(--accent);
             color: white; border: none;
             padding: 12px 28px; border-radius: 30px;
             font-size: 14px; text-decoration: none;
             display: flex; align-items: center; gap: 10px;
             transition: 0.3s; font-weight: 600;
             box-shadow: 0 10px 20px rgba(255, 87, 51, 0.2);
           }
           .lightbox-btn.secondary {
             background: rgba(255,255,255,0.1);
             box-shadow: none;
           }
           .lightbox-btn:hover { 
             transform: translateY(-3px);
             box-shadow: 0 15px 30px rgba(255, 87, 51, 0.4);
           }
           .lightbox-btn.secondary:hover {
             background: rgba(255,255,255,0.2);
           }

           /* 📍 LOCATION CARD */
           .location-card {
             width: 250px;
             background: rgba(255,255,255,0.03);
             border: 1px solid rgba(255,255,255,0.1);
             border-radius: 12px;
             overflow: hidden;
             display: flex;
             flex-direction: column;
           }
           .location-map-preview {
             width: 100%;
             height: 150px;
             border-bottom: 1px solid rgba(255,255,255,0.1);
           }
           .location-info {
             padding: 12px;
             display: flex;
             align-items: center;
             gap: 10px;
             font-size: 0.85rem;
             color: #fff;
           }
           .location-link {
             background: var(--accent);
             color: white;
             text-align: center;
             padding: 10px;
             font-size: 0.75rem;
             font-weight: 800;
             letter-spacing: 1px;
             text-decoration: none;
             transition: 0.3s;
           }
           .location-link:hover {
             filter: brightness(1.2);
           }
           .location-box {
             width: 100%;
             background: rgba(255,255,255,0.02);
             padding: 20px;
             border-radius: 20px;
             border: 1px dashed rgba(255,255,255,0.1);
           }

           .location-search-box {
             background: rgba(255,255,255,0.03);
             border: 1px solid rgba(255,255,255,0.1);
             border-radius: 12px;
             display: flex;
             align-items: center;
             padding: 5px 5px 5px 15px;
           }
           .location-search-box input {
             flex: 1;
             background: none;
             border: none;
             color: #fff;
             outline: none;
             font-size: 0.85rem;
             padding: 8px 0;
           }
           .location-search-box button {
             width: 35px;
             height: 35px;
             background: var(--accent);
             border: none;
             border-radius: 8px;
             color: #fff;
             display: flex;
             align-items: center;
             justify-content: center;
             cursor: pointer;
           }
           .location-search-box button:disabled { opacity: 0.5; }

           /* 🌎 LEAFLET OVERRIDES */
           .leaflet-container {
             font-family: inherit;
             background: #111 !important;
           }
           .leaflet-tile {
             filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
           }
           .leaflet-control-attribution {
             display: none;
           }
           .leaflet-marker-icon {
             filter: hue-rotate(320deg) brightness(1.2);
           }
        `}</style>
    </div>
  );
}

export default Messenger;
