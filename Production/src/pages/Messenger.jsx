import { toast } from 'react-hot-toast';
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI, usersAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import '../css/Messenger.css';
import PremiumLoader from '../components/PremiumLoader';
import { PATHS } from '../routes/paths';
import { 
  FiSend, FiCheck, FiCheckCircle, FiMessageSquare, FiActivity, FiZap, 
  FiArrowLeft, FiAlertTriangle, FiSearch, FiChevronDown,
  FiPhone, FiPlus, FiImage, FiMic, FiPaperclip, FiArchive, FiUsers, 
  FiLogOut, FiShoppingBag, FiUserPlus, FiFilter, FiFileText, FiFile,
  FiMusic, FiX, FiPlay, FiPause, FiDownload, FiMapPin, FiCornerUpLeft
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

const WAVEFORM_BARS = [8, 14, 20, 13, 25, 18, 10, 22, 30, 16, 24, 12, 19, 27, 15, 9, 21, 14];

const formatAudioTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const rounded = Math.floor(seconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

function VoiceWaveformMessage({ src, fileName }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progress = duration > 0 ? currentTime / duration : 0;
  const activeBars = isPlaying && duration === 0
    ? 3
    : Math.min(WAVEFORM_BARS.length, Math.ceil(progress * WAVEFORM_BARS.length));

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      toast.error('ไม่สามารถเล่นไฟล์เสียงได้');
      setIsPlaying(false);
    }
  };

  return (
    <div className={`voice-waveform-message${isPlaying ? ' is-playing' : ''}`}>
      <button
        type="button"
        className="voice-wave-play"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <FiPause size={15} /> : <FiPlay size={15} />}
      </button>

      <div className="voice-wave-body">
        <div className="voice-wave-bars" aria-hidden="true">
          {WAVEFORM_BARS.map((height, idx) => (
            <span
              key={`${height}-${idx}`}
              className={idx < activeBars ? 'is-active' : ''}
              style={{ '--bar-height': `${height}px`, '--bar-delay': `${idx * 34}ms` }}
            />
          ))}
        </div>
        <div className="voice-wave-meta">
          <span>{fileName || 'Voice note'}</span>
          <time>{formatAudioTime(currentTime || duration)}</time>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onEnded={(event) => {
          setIsPlaying(false);
          event.currentTarget.currentTime = 0;
          setCurrentTime(0);
        }}
      />
    </div>
  );
}

const getParticipantUser = (participant) => {
  if (!participant) return null;
  const user = participant.user || participant;
  return typeof user === 'object' ? user : { _id: user };
};

const getParticipantUserId = (participant) => {
  const user = getParticipantUser(participant);
  return user?._id || user?.id || null;
};

const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation?.participants?.length) return null;
  return conversation.participants.find((participant) => (
    String(getParticipantUserId(participant)) !== String(currentUserId)
  )) || null;
};

function Messenger() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user: contextUser, token: contextToken, logout, profileUpdateTag } = useContext(AuthContext);
  const shouldReduceMotion = useReducedMotion();
  const currentToken = contextToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
  const currentUser = contextUser || JSON.parse(window.safeStorage.getItem('userInfo'));
  const contextUserId = currentUser?._id || currentUser?.id;

  // 🧪 State Management
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'group', 'archive'
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const shouldSendRecordingRef = useRef(true);
  const wasNearBottomRef = useRef(true);
  const previousChatIdRef = useRef(null);
  
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

  const mergeConversation = useCallback((conversation) => {
    if (!conversation?._id) return;

    setConversations((prev) => {
      const existingIdx = prev.findIndex((item) => String(item._id) === String(conversation._id));
      if (existingIdx === -1) return [conversation, ...prev];

      const next = [...prev];
      const existing = next[existingIdx];
      next.splice(existingIdx, 1);
      return [{ ...existing, ...conversation }, ...next];
    });

    setCurrentChat((prev) => (
      prev && String(prev._id) === String(conversation._id)
        ? { ...prev, ...conversation }
        : prev
    ));
  }, []);

  const fetchAndMergeConversation = useCallback(async (targetConversationId) => {
    if (!targetConversationId || !currentToken) return null;
    try {
      const conversation = await chatAPI.getConversation(targetConversationId);
      mergeConversation(conversation);
      return conversation;
    } catch (err) {
      console.error('Fetch conversation update error:', err);
      return null;
    }
  }, [currentToken, mergeConversation]);

  const resetGroupComposer = useCallback(() => {
    setGroupName('');
    setGroupSearchQuery('');
    setGroupSearchResults([]);
    setSelectedGroupMembers([]);
    setGroupError('');
    setGroupLoading(false);
  }, []);

  const closeGroupComposer = useCallback(() => {
    setShowGroupModal(false);
    resetGroupComposer();
  }, [resetGroupComposer]);

  // 🟢 อัปเดต Refs ทุกครั้งที่ State เปลี่ยน
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const isNewDay = (prevDate, currDate) => new Date(prevDate).toDateString() !== new Date(currDate).toDateString();
  const formatDateDivider = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'วันนี้';
    if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวานนี้';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSenderName = (senderId) => {
    if (!senderId) return 'Someone';
    const idStr = typeof senderId === 'object' ? (senderId._id || senderId.id) : senderId;
    if (idStr === contextUserId) return 'คุณ';
    
    const participant = currentChat?.participants?.find(p => String(p.user?._id || p.user) === String(idStr));
    if (participant?.user?.name) return participant.user.name;
    return 'Someone';
  };

  const scrollToMessage = (messageId) => {
    console.log("scrollToMessage called with ID:", messageId);
    if (!messageId) return;
    const el = document.getElementById(`msg-${messageId}`);
    const container = messageAreaRef.current;
    console.log("Found element and container in DOM:", el, container);
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top + container.scrollTop;
      const targetScroll = relativeTop - (container.clientHeight / 2) + (elRect.height / 2);

      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      el.classList.add('highlight-msg');
      setTimeout(() => {
        el.classList.remove('highlight-msg');
      }, 1500);
    } else {
      toast.error('ไม่พบข้อความต้นฉบับ');
    }
  };

  useEffect(() => {
    activeChatIdRef.current = currentChat ? currentChat._id : null;
    
    // สั่งให้ Socket เข้าห้องแชท (join_room)
    if (socket && currentChat) {
      socket.emit("join_room", currentChat._id);
    }
  }, [currentChat, socket]);

  useEffect(() => {
    if (!showGroupModal) return undefined;

    const query = groupSearchQuery.trim();
    if (!query) {
      setGroupSearchResults([]);
      setGroupError('');
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await usersAPI.searchUsers(query);
        const users = Array.isArray(results) ? results : (results?.users || []);
        if (!cancelled) {
          setGroupSearchResults(users.filter(user => String(user._id || user.id) !== String(contextUserId)));
          setGroupError('');
        }
      } catch (err) {
        console.error('Group member search error:', err);
        if (!cancelled) {
          setGroupSearchResults([]);
          setGroupError('Could not search teammates right now.');
        }
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showGroupModal, groupSearchQuery, contextUserId]);

  // 📡 Socket Effects
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      // console.log("📥 Socket รับข้อมูลข้อความใหม่:", data);
      
      // แปลงเป็น String เพื่อป้องกันปัญหา Type ไม่ตรงกันระหว่าง ObjectId ฝั่ง DB กับ String
      const currentChatId = String(activeChatIdRef.current);
      const incomingChatId = String(data.conversationId || data.roomId || data.conversation);
      const isFromMe = String(data.sender?._id || data.sender) === String(contextUserId);

      // ✅ 1. Update the active chat messages panel
      if (currentChatId === incomingChatId) {
        setMessages((prev) => {
          const isDuplicate = prev.some(m => String(m._id) === String(data._id));
          if (isDuplicate) return prev;

          if (isFromMe) {
            // Replace optimistic placeholder if it exists, else just add
            const optimisticIdx = prev.findIndex(m => m._optimistic);
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = { ...data, isRead: false };
              return updated;
            }
            return [...prev, data];
          }
          
          // Message from other person — mark as read since we're looking at it
          socket.emit("mark_read", {
            conversationId: incomingChatId,
            readerId: contextUserId,
            senderId: data.sender?._id || data.sender
          });
          return [...prev, { ...data, isRead: true }];
        });
      }

      // ✅ 2. Real-time inbox: update conversation preview & bubble to top
      setConversations((prev) => {
        const convIdx = prev.findIndex(c => String(c._id) === incomingChatId);
        
        // Loophole fix: If it's a new conversation, create a temp entry
        if (convIdx === -1) {
          fetchAndMergeConversation(incomingChatId);
          return prev;
        }

        const updated = [...prev];
        const conv = { ...updated[convIdx] };
        
        conv.lastMessage = {
          ...conv.lastMessage,
          _id: data._id,
          text: data.text || (data.attachments?.length > 0 ? `[file]` : ''),
          sender: data.sender?._id || data.sender,
          isRead: currentChatId === incomingChatId,
          createdAt: data.createdAt || new Date().toISOString(),
        };
        conv.updatedAt = data.createdAt || new Date().toISOString();

        if (currentChatId !== incomingChatId && !isFromMe) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }

        updated.splice(convIdx, 1);
        return [conv, ...updated];
      });
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

    const handleConversationUpdated = (data) => {
      const targetConversationId = data?.conversationId || data?.message?.conversationId || data?.message?.roomId;
      if (targetConversationId) fetchAndMergeConversation(targetConversationId);
    };

    // เปิดรับ Event
    socket.on("receive_message", handleReceiveMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("call_incoming", handleCallIncoming);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("call_incoming", handleCallIncoming);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket, contextUserId, fetchAndMergeConversation]);

  // 📦 Logic: Fetching Data
  const fetchConversations = async (filterOverride) => {
    try {
      if (!currentToken) return;
      const filterToUse = filterOverride || activeTab;
      const data = await chatAPI.getMyConversations(filterToUse);
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

  const addGroupMember = (member) => {
    const memberId = member?._id || member?.id;
    if (!memberId) return;

    setSelectedGroupMembers((prev) => (
      prev.some(item => String(item._id || item.id) === String(memberId))
        ? prev
        : [...prev, member]
    ));
    setGroupSearchQuery('');
    setGroupSearchResults([]);
    setGroupError('');
  };

  const removeGroupMember = (memberId) => {
    setSelectedGroupMembers((prev) => prev.filter(item => String(item._id || item.id) !== String(memberId)));
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      setGroupError('Group name is required.');
      return;
    }

    if (selectedGroupMembers.length === 0) {
      setGroupError('Select at least one teammate.');
      return;
    }

    try {
      setGroupLoading(true);
      setGroupError('');

      const conversation = await chatAPI.createGroup({
        name: trimmedGroupName,
        members: selectedGroupMembers.map(member => member._id || member.id)
      });

      mergeConversation(conversation);
      setActiveTab('group');
      setCurrentChat(conversation);
      closeGroupComposer();
      toast.success('Group created');
    } catch (err) {
      console.error('Create group error:', err);
      setGroupError(err?.response?.data?.message || 'Could not create this group.');
      toast.error('Could not create group');
    } finally {
      setGroupLoading(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!currentChat?._id) return;

    const shouldArchive = !currentChat.myState?.isArchived;
    const updatedState = {
      ...(currentChat.myState || {}),
      isArchived: shouldArchive
    };

    setConversations((prev) => prev.map((conversation) => (
      String(conversation._id) === String(currentChat._id)
        ? { ...conversation, myState: { ...(conversation.myState || {}), isArchived: shouldArchive } }
        : conversation
    )));
    setCurrentChat((prev) => (
      prev ? { ...prev, myState: updatedState } : prev
    ));

    try {
      await chatAPI.toggleArchive(currentChat._id, shouldArchive);
      toast.success(shouldArchive ? 'Moved to archive' : 'Restored from archive');

      if (shouldArchive && activeTab !== 'archive') {
        setCurrentChat(null);
      }
    } catch (err) {
      console.error('Archive conversation error:', err);
      setConversations((prev) => prev.map((conversation) => (
        String(conversation._id) === String(currentChat._id)
          ? { ...conversation, myState: { ...(conversation.myState || {}), isArchived: !shouldArchive } }
          : conversation
      )));
      setCurrentChat((prev) => (
        prev ? { ...prev, myState: { ...(prev.myState || {}), isArchived: !shouldArchive } } : prev
      ));
      toast.error('Could not update archive');
    }
  };

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

    // 1. Filter by Active Tab (All, Unread, Group, Archive)
    if (activeTab === 'archive') {
      filtered = filtered.filter(c => c.myState?.isArchived === true);
    } else {
      filtered = filtered.filter(c => c.myState?.isArchived !== true);

      if (activeTab === 'group') {
        filtered = filtered.filter(c => c.isGroup);
      } else {
        filtered = filtered.filter(c => !c.isGroup);
      }

      if (activeTab === 'unread') {
        filtered = filtered.filter(c => 
          c.lastMessage && 
          !c.lastMessage.isRead && 
          String(c.lastMessage.sender?._id || c.lastMessage.sender) !== String(contextUserId)
        );
      }
    }

    // 2. Filter by Search
    if (searchQuery) {
      filtered = filtered.filter(c => {
        const friend = c.isGroup ? null : getOtherParticipant(c, contextUserId);
        const friendUser = getParticipantUser(friend);
        const name = c.isGroup ? c.groupName : (friendUser?.name || "Unknown");
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    setFilteredConversations(filtered);
  }, [conversations, activeTab, searchQuery, contextUserId]);

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

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        shouldSendRecordingRef.current = false;
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const getSupportedAudioMime = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  };

  const sendVoiceBlob = async (blob, mimeType) => {
    if (!currentChat || !currentToken || blob.size === 0) return;

    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType || blob.type });
    const previewUrl = URL.createObjectURL(blob);

    const formData = new FormData();
    formData.append('conversationId', currentChat._id);
    formData.append('messageType', 'audio');
    formData.append('attachments', file);

    setIsUploading(true);
    const optimisticId = `opt_voice_${Date.now()}`;
    const optimisticMsg = {
      _id: optimisticId,
      conversationId: currentChat._id,
      sender: contextUserId,
      text: '',
      messageType: 'audio',
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: [{
        url: previewUrl,
        fileType: mimeType || 'audio/webm',
        fileName: file.name,
        fileSize: file.size,
      }],
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatAPI.sendMessage(formData, currentToken);
      setMessages((prev) => prev.map((m) => (m._id === optimisticId ? res : m)));
      if (socket) {
        socket.emit('stop_typing', { roomId: currentChat._id, userId: contextUserId });
      }
      toast.success('ส่งคลิปเสียงแล้ว');
    } catch (err) {
      console.error('Voice send error:', err);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
      toast.error('ส่งคลิปเสียงไม่สำเร็จ');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setIsUploading(false);
    }
  };

  const stopRecording = (send = true) => {
    shouldSendRecordingRef.current = send;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!currentChat || isRecording || isUploading) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('เบราว์เซอร์ไม่รองรับการบันทึกเสียง');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = getSupportedAudioMime();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      shouldSendRecordingRef.current = true;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const usedMime = mimeType || recorder.mimeType || 'audio/webm';
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;

        if (!shouldSendRecordingRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: usedMime });
        audioChunksRef.current = [];
        await sendVoiceBlob(blob, usedMime);
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access error:', err);
      toast.error('ไม่สามารถเข้าถึงไมโครโฟนได้ — กรุณาอนุญาตการใช้งาน');
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) stopRecording(true);
    else startRecording();
  };

  const cancelVoiceRecording = () => {
    stopRecording(false);
    toast('ยกเลิกการบันทึกแล้ว', { icon: '🎙️' });
  };

  // ✍️ Event Handlers
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !currentChat || !currentToken) return;

    const formData = new FormData();
    formData.append('conversationId', currentChat._id);
    if (newMessage.trim()) formData.append('text', newMessage);
    if (replyingTo) formData.append('replyTo', replyingTo._id);
    
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(item => {
        formData.append('attachments', item.file);
      });
    }

    setIsUploading(true);
    // Optimistic: add message immediately to our own UI (will be deduped when socket arrives)
    const optimisticId = `opt_${Date.now()}`;
    const optimisticMsg = {
      _id: optimisticId,
      conversationId: currentChat._id,
      sender: contextUserId,
      text: newMessage,
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: selectedFiles.map(f => ({
        url: f.preview || '',
        fileType: f.file.type || 'image/jpeg',
        fileName: f.file.name || 'uploading...',
        fileSize: f.file.size || 0
      })),
      replyTo: replyingTo ? {
        _id: replyingTo._id,
        text: replyingTo.text,
        sender: replyingTo.sender,
        messageType: replyingTo.messageType,
        attachments: replyingTo.attachments
      } : null,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    const currentReplyingTo = replyingTo;
    setReplyingTo(null);

    try {
      const res = await chatAPI.sendMessage(formData, currentToken);
      // Replace the optimistic message with the real one from server
      setMessages(prev => prev.map(m => m._id === optimisticId ? res : m));
      if (socket) {
        // No need to re-emit send_message: backend already emits receive_message to the room
        socket.emit("stop_typing", { roomId: currentChat._id, userId: contextUserId });
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsUploading(false);
      // Clean up previews ONLY after attempt finishes
      selectedFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
      setSelectedFiles([]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        isAudio: file.type.startsWith('audio/'),
        id: Math.random().toString(36).substr(2, 9)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
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
          toast.error("Found but outside Thailand boundary.");
        }
      } else {
        toast.error("Place not found. Try more specific name.");
      }
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const endCall = () => {
    if (activeCall && socket) {
      socket.emit("end_call", { to: activeCall.to });
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  const isMessageAreaNearBottom = () => {
    const node = messageAreaRef.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight < 140;
  };

  const scrollToLatestMessage = (behavior = 'smooth') => {
    requestAnimationFrame(() => {
      const node = messageAreaRef.current;
      const scrollBehavior = shouldReduceMotion && behavior === 'smooth' ? 'auto' : behavior;
      if (node) {
        node.scrollTo({ top: node.scrollHeight, behavior: scrollBehavior });
      } else if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: scrollBehavior });
      }
      wasNearBottomRef.current = true;
      setShowScrollDown(false);
    });
  };

  const handleMessageAreaScroll = () => {
    const nearBottom = isMessageAreaNearBottom();
    wasNearBottomRef.current = nearBottom;
    setShowScrollDown(!nearBottom && messages.length > 0);
  };

  useEffect(() => {
    const activeChatId = currentChat?._id || null;
    const chatChanged = previousChatIdRef.current !== activeChatId;
    previousChatIdRef.current = activeChatId;

    const latestMessage = messages[messages.length - 1];
    const latestSender = latestMessage?.sender?._id || latestMessage?.sender?.id || latestMessage?.sender;
    const latestFromMe = latestSender && String(latestSender) === String(contextUserId);

    if (chatChanged || latestFromMe || wasNearBottomRef.current) {
      scrollToLatestMessage(chatChanged ? 'auto' : 'smooth');
      return;
    }

    setShowScrollDown(messages.length > 0);
  }, [messages, currentChat?._id, contextUserId, shouldReduceMotion]);


  if (loading) return (
    <PremiumLoader text="Connecting Com-Link..." subtext="กำลังโหลดข้อความ..." />
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
                <button
                  className={`nav-btn ${activeNav === 'chats' && activeTab !== 'group' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav('chats');
                    setActiveTab('all');
                  }}
                >
                   <FiMessageSquare />
                </button>
                <button
                  className={`nav-btn ${activeTab === 'group' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav('chats');
                    setActiveTab('group');
                  }}
                >
                   <FiUsers />
                </button>
                <button className="nav-btn" onClick={() => navigate(PATHS.discovery)}>
                   <FiShoppingBag />
                </button>
                <button className="nav-btn" onClick={() => navigate(PATHS.friends)}>
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
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activeTab === 'group' ? 'Groups' : 'Chats'}</h2>
                <button
                  type="button"
                  className="new-chat-btn"
                  onClick={() => setShowGroupModal(true)}
                  aria-label="Create work group"
                  title="Create work group"
                >
                  <FiPlus />
                </button>
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
                <button className={activeTab === 'group' ? 'active' : ''} onClick={() => setActiveTab('group')}>Group</button>
                <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>Archive</button>
             </div>
          </div>

          <div className="conversation-list">
             {filteredConversations.length === 0 ? (
                <div className="empty-state">No connection found</div>
             ) : (
                filteredConversations.map(conv => {
                   const friend = conv.isGroup ? null : getOtherParticipant(conv, contextUserId);
                   const friendUser = getParticipantUser(friend);
                   const name = conv.isGroup ? conv.groupName : (friendUser?.name || "Unknown");
                   const img = conv.isGroup ? (conv.groupImage?.url || '') : (friendUser?.profileImage?.url || '');
                   const isSelected = currentChat?._id === conv._id;
                   const online = conv.isGroup ? false : isUserOnline(friendUser?._id);

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
                   <div className="chat-header-identity">
                      <button className="mobile-back" onClick={() => setCurrentChat(null)} aria-label="Back to chat list">
                         <FiArrowLeft />
                         <span>Back</span>
                      </button>
                      <div className="chat-avatar">
                         {(() => {
                           const friend = currentChat.isGroup ? null : getOtherParticipant(currentChat, contextUserId);
                           const friendUser = getParticipantUser(friend);
                           const img = currentChat.isGroup ? (currentChat.groupImage?.url || '') : (friendUser?.profileImage?.url || '');
                           return <img src={img ? getFullUrl(img) : 'https://via.placeholder.com/45'} alt="" />;
                         })()}
                      </div>
                      <div>
                         <div className="chat-title">
                            {currentChat.isGroup ? currentChat.groupName : getParticipantUser(getOtherParticipant(currentChat, contextUserId))?.name}
                         </div>
                          <div className="chat-status">
                             {Object.keys(typingUsers).length > 0 
                                ? `${Object.values(typingUsers).join(', ')} is typing...` 
                                : (currentChat.isGroup ? `${currentChat.participants.length} members` : 'Active now')}
                          </div>
                      </div>
                   </div>
                   <div className="chat-header-actions">
                      <button
                        type="button"
                        className={`icon-action-btn ${currentChat.myState?.isArchived ? 'is-archived' : ''}`}
                        onClick={handleToggleArchive}
                        aria-label={currentChat.myState?.isArchived ? 'Restore conversation' : 'Archive conversation'}
                        title={currentChat.myState?.isArchived ? 'Restore conversation' : 'Archive conversation'}
                      >
                         <FiArchive />
                      </button>
                   </div>
                   
                </div>

                 <div className="message-stage">
                 <div 
                   ref={messageAreaRef}
                   className={`message-area ${isDragging ? 'dragging' : ''}`}
                   onScroll={handleMessageAreaScroll}
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
                      const attachments = m.attachments || [];
                      const hasImageAttachment = attachments.some((att) => (att.fileType || '').startsWith('image/'));
                      const hasAudioAttachment = attachments.some((att) => (att.fileType || '').startsWith('audio/'));
                      const showDateDivider = i === 0 || isNewDay(messages[i - 1].createdAt, m.createdAt);

                      return (
                         <div key={m._id || i} className="msg-group">
                            {showDateDivider && (
                               <div className="msg-date-divider">
                                  <span>{formatDateDivider(m.createdAt)}</span>
                               </div>
                            )}
                            <div id={`msg-${m._id}`} className={`msg-wrapper ${isMe ? 'me' : 'them'}${hasImageAttachment ? ' has-image-media' : ''}${hasAudioAttachment ? ' has-voice-media' : ''}`}>
                               {!isMe && currentChat.isGroup && (
                                  <img src={getFullUrl(m.sender?.profileImage?.url)} className="msg-avatar-small" alt="avatar" />
                               )}
                               <div className="msg-bubble-container">
                                  <button className="msg-reply-btn" onClick={() => setReplyingTo(m)} aria-label="Reply to message">
                                     <FiCornerUpLeft size={16} />
                                  </button>
                                  <div className="msg-bubble">
                                     {m.replyTo && (
                                        <div className="msg-quote-block" onClick={(e) => { e.stopPropagation(); scrollToMessage(m.replyTo._id); }}>
                                           <div className="quote-sender">{getSenderName(m.replyTo.sender)}</div>
                                           <div className="quote-text">{m.replyTo.text || (m.replyTo.attachments?.length > 0 ? '[Attachment]' : '')}</div>
                                        </div>
                                     )}
                               {attachments.length > 0 && (
                                  <div className={`msg-attachments ${attachments.length === 1 ? 'single' : ''}`}>
                                     {attachments.map((att, idx) => (
                                        <div key={idx} className="msg-att-item">
                                           {(att.fileType || '').startsWith('image/') ? (
                                              <img 
                                                src={getFullUrl(att.url)} 
                                                className="msg-img-preview" 
                                                onClick={() => setPreviewImage(getFullUrl(att.url))} 
                                                alt="attachment"
                                              />
                                           ) : (att.fileType || '').startsWith('audio/') ? (
                                              <VoiceWaveformMessage src={getFullUrl(att.url)} fileName={att.fileName} />
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
                            </div>
                         </div>
                      )
                   })}
                   <div ref={scrollRef} />
                </div>

                <AnimatePresence>
                  {showScrollDown && (
                    <motion.button
                      type="button"
                      className="scroll-latest-btn"
                      onClick={() => scrollToLatestMessage('smooth')}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      aria-label="Scroll to latest message"
                    >
                      <FiChevronDown />
                      <span>Latest</span>
                    </motion.button>
                  )}
                </AnimatePresence>
                </div>

                <div className="chat-input-wrapper">
                     <AnimatePresence>
                        {replyingTo && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="reply-preview-bar"
                          >
                            <div className="reply-preview-content">
                              <span className="reply-preview-name">ตอบกลับ {getSenderName(replyingTo.sender)}</span>
                              <span className="reply-preview-text">{replyingTo.text || (replyingTo.attachments?.length > 0 ? '[Attachment]' : '')}</span>
                            </div>
                            <button type="button" className="reply-preview-close" onClick={() => setReplyingTo(null)}>
                              <FiX size={18} />
                            </button>
                          </motion.div>
                        )}
                        {isRecording && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="voice-recording-bar"
                          >
                            <span className="rec-pulse-dot" />
                            <span className="rec-label">กำลังบันทึกเสียง</span>
                            <span className="rec-timer">{formatRecordingTime(recordingDuration)}</span>
                            <button type="button" className="rec-cancel-btn" onClick={cancelVoiceRecording}>ยกเลิก</button>
                            <button type="button" className="rec-send-btn" onClick={() => stopRecording(true)}>ส่ง</button>
                          </motion.div>
                        )}
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
                                    ) : f.isAudio || f.file.type.startsWith('audio/') ? (
                                       <div className="file-icon-placeholder audio-preview">
                                          <FiMusic />
                                          <span>Voice</span>
                                       </div>
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
                                      type="button"
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
                       <input type="file" ref={fileInputRef} hidden accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.zip" multiple onChange={handleFileSelect} />
                       <button type="button" className="input-aux-btn" onClick={() => fileInputRef.current?.click()} aria-label="แนบไฟล์"><FiPlus /></button>
                       <button type="button" className="input-aux-btn" onClick={() => imageInputRef.current?.click()} aria-label="แนบรูปภาพ"><FiImage /></button>
                       <button
                          type="button"
                          className="input-aux-btn"
                          onClick={() => setShowLocationPicker(true)}
                          title="แชร์ตำแหน่ง (เฉพาะประเทศไทย)"
                          aria-label="แชร์ตำแหน่ง"
                        >
                          <FiMapPin />
                        </button>
                    </div>

                    <form className="input-form" onSubmit={handleSendMessage}>
                        <textarea
                           placeholder="Type your message here..."
                           value={newMessage}
                           rows={1}
                           disabled={isRecording}
                           onChange={(e) => {
                              handleTyping(e);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
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
                           <button
                             type="button"
                             className={`mic-btn${isRecording ? ' recording' : ''}`}
                             onClick={toggleVoiceRecording}
                             disabled={isUploading}
                             title={isRecording ? 'หยุดและส่งคลิปเสียง' : 'บันทึกเสียง'}
                             aria-label={isRecording ? 'หยุดบันทึกเสียง' : 'บันทึกเสียง'}
                           >
                             <FiMic />
                           </button>
                           <button type="submit" className="send-btn" disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading || isRecording}>
                              {isUploading ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiZap /></motion.span> : <FiSend />}
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
          {showGroupModal && (
             <motion.div
               className="call-overlay"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                 if (!groupLoading) closeGroupComposer();
               }}
             >
                <motion.form
                  className="group-dialog"
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                  onClick={(event) => event.stopPropagation()}
                  onSubmit={handleCreateGroup}
                >
                   <div className="group-dialog-header">
                      <div className="group-dialog-icon">
                         <FiUsers />
                      </div>
                      <div>
                         <h3>Create work group</h3>
                         <p>Build a shared chat for teammates and collaborators.</p>
                      </div>
                      <button
                        type="button"
                        className="lightbox-close group-dialog-close"
                        onClick={closeGroupComposer}
                        disabled={groupLoading}
                        aria-label="Close group composer"
                      >
                         <FiX />
                      </button>
                   </div>

                   <label className="group-field">
                      <span>Group name</span>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        placeholder="Project team, event crew, sales group..."
                        maxLength={80}
                        autoFocus
                      />
                   </label>

                   <label className="group-field">
                      <span>Add teammates</span>
                      <div className="group-search-box">
                         <FiSearch />
                         <input
                           type="text"
                           value={groupSearchQuery}
                           onChange={(event) => setGroupSearchQuery(event.target.value)}
                           placeholder="Search people by name..."
                         />
                      </div>
                   </label>

                   {selectedGroupMembers.length > 0 && (
                      <div className="group-selected-list" aria-label="Selected members">
                         {selectedGroupMembers.map((member) => {
                            const memberId = member._id || member.id;
                            return (
                               <span className="group-chip" key={memberId}>
                                  {member.name || member.username || member.email || 'Member'}
                                  <button type="button" onClick={() => removeGroupMember(memberId)} aria-label="Remove member">
                                     <FiX />
                                  </button>
                               </span>
                            );
                         })}
                      </div>
                   )}

                   <div className="group-search-results">
                      {groupSearchQuery.trim() && groupSearchResults.length === 0 && !groupError && (
                         <div className="group-empty-row">No teammates found</div>
                      )}

                      {groupSearchResults
                        .filter(member => !selectedGroupMembers.some(item => String(item._id || item.id) === String(member._id || member.id)))
                        .slice(0, 8)
                        .map((member) => {
                          const memberId = member._id || member.id;
                          const profileImage = member.profileImage?.url || (typeof member.profileImage === 'string' ? member.profileImage : '');
                          return (
                            <button
                              key={memberId}
                              type="button"
                              className="group-user-row"
                              onClick={() => addGroupMember(member)}
                            >
                               <img src={profileImage ? getFullUrl(profileImage) : 'https://via.placeholder.com/40'} alt="" />
                               <span>
                                  <strong>{member.name || member.username || member.email || 'Member'}</strong>
                                  <small>{member.profession || member.email || 'Collaborator'}</small>
                               </span>
                               <FiPlus />
                            </button>
                          );
                        })}
                   </div>

                   {groupError && <div className="group-error">{groupError}</div>}

                   <div className="group-dialog-actions">
                      <button type="button" className="group-cancel-btn" onClick={closeGroupComposer} disabled={groupLoading}>
                         Cancel
                      </button>
                      <button type="submit" className="group-submit-btn" disabled={groupLoading}>
                         {groupLoading ? 'Creating...' : 'Create group'}
                      </button>
                   </div>
                </motion.form>
             </motion.div>
          )}
       </AnimatePresence>

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
                            return toast.error("ขออภัย ระบบรองรับเฉพาะการแชร์ตำแหน่งภายในประเทศไทยเท่านั้น");
                          }

                          chatAPI.sendMessage({
                            conversationId: currentChat._id,
                            text: JSON.stringify(pickedLocation),
                            messageType: 'location'
                          }).then((m) => {
                            setMessages((prev) => (
                              prev.some((message) => String(message._id) === String(m._id))
                                ? prev
                                : [...prev, m]
                            ));
                            setShowLocationPicker(false);
                            fetchAndMergeConversation(currentChat._id);
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
