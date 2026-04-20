import { useState, useEffect, useContext, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getFullUrl } from '../utils/mediaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiCheck, FiCheckCircle, FiMessageSquare, FiActivity, FiZap, FiMoreVertical, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';

function Messenger() {
  const { user: contextUser, token: contextToken } = useContext(AuthContext);
  const currentToken = contextToken || localStorage.getItem('userToken') || localStorage.getItem('token');
  const currentUser = contextUser || JSON.parse(localStorage.getItem('userInfo'));

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const scrollRef = useRef();

  const { socket, isUserOnline, refreshOnlineUsers } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (data) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m._id === data._id);
        if (isDuplicate) return prev;

        if (window.currentChatId === data.conversationId) {
          if (data.sender !== contextUserId) {
            socket.emit("mark_read", {
              conversationId: data.conversationId,
              readerId: contextUserId,
              senderId: data.sender
            });
            return [...prev, { ...data, isRead: true }];
          }
          return [...prev, data];
        }
        return prev;
      });
      fetchConversations();
    });

    socket.on("messages_read", (data) => {
      if (window.currentChatId === data.conversationId) {
        setMessages((prev) => prev.map(m =>
          m.sender !== data.readerId ? { ...m, isRead: true } : m
        ));
      }
      setConversations(prev => prev.map(c =>
        c._id === data.conversationId ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } } : c
      ));
    });

    return () => {
      socket.off("receive_message");
      socket.off("messages_read");
    };
  }, [socket]);

  const contextUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (currentChat && currentToken && socket) {
      window.currentChatId = currentChat._id;
      socket.emit("join_room", currentChat._id);

      chatAPI.markAsRead(currentChat._id, currentToken).catch(err => console.error(err));

      const friend = currentChat.participants.find(p => p._id !== contextUserId);
      if (friend) {
        socket.emit("mark_read", {
          conversationId: currentChat._id,
          readerId: contextUserId,
          senderId: friend._id
        });
      }
    }
  }, [currentChat, currentToken, contextUserId, socket]);

  const fetchConversations = async () => {
    try {
      if (!currentToken) return;
      const data = await chatAPI.getMyConversations(currentToken);
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
    fetchConversations();
    if (refreshOnlineUsers) refreshOnlineUsers();
  }, [currentToken, refreshOnlineUsers]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat || !currentToken) return;

    const messageData = {
      conversationId: currentChat._id,
      text: newMessage
    };

    try {
      const res = await chatAPI.sendMessage(messageData, currentToken);
      if (socket) {
        socket.emit("send_message", {
          ...res,
          roomId: currentChat._id
        });
      }
      setMessages([...messages, res]);
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <p style={{ color: '#444', fontWeight: '700', letterSpacing: '4px', fontSize: '0.8rem' }}>ESTABLISHING SECURE CONNECTION...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '25px', textAlign: 'center' }}>
        <FiAlertTriangle size={60} color="var(--accent)" />
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px' }}>COM-LINK DISRUPTED</h2>
        <p style={{ color: '#444', maxWidth: '400px', fontWeight: '500' }}>We lost connection to the communications hub. Please verify your signal and reboot.</p>
        <button onClick={() => window.location.reload()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}>RETRY CONNECTION</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '100px', display: 'flex', justifyContent: 'center', paddingBottom: '100px' }} className="messenger-page">
      <div className={`glass messenger-container ${currentChat ? 'chat-active' : ''}`}>

        {/* 🧬 Sidebar: Inbox Grid */}
        <div className="messenger-sidebar">
          <div style={{ padding: '35px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <FiZap color="var(--accent)" size={14} />
              <span style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '4px' }}>PAL CHAT</span>
            </div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-1px' }}>Inbox</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#222', fontWeight: '700', fontSize: '0.9rem' }}>No conversations yet</div>
            ) : (
              conversations.map((conv) => {
                const friend = conv.participants.find(p => p._id !== contextUserId);
                const isSelected = currentChat?._id === conv._id;
                const isOnline = isUserOnline(friend?._id);
                return (
                  <motion.div
                    key={conv._id}
                    onClick={() => setCurrentChat(conv)}
                    whileHover={{ x: 10, background: 'rgba(255,255,255,0.03)' }}
                    style={{
                      padding: '20px 25px',
                      borderRadius: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 87, 51, 0.05)' : 'transparent',
                      border: isSelected ? '1px solid rgba(255, 87, 51, 0.1)' : '1px solid transparent',
                      transition: '0.3s',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ position: 'relative', width: '55px', height: '55px', flexShrink: 0 }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0a0a', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.05)' }}>
                        {friend?.profileImage?.url ? (
                          <img src={getFullUrl(friend.profileImage.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontWeight: '700' }}>?</div>
                        )}
                      </div>
                      {isOnline && (
                        <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#22c55e', border: '3px solid #050505' }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.05rem', letterSpacing: '-0.3px', marginBottom: '4px' }}>{friend?.name || "Unknown"}</div>
                      <div style={{ color: isSelected ? 'var(--accent)' : '#444', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '800' }}>
                        {conv.lastMessage?.text || "Start a new connection"}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="messenger-chat">
          {currentChat ? (
            <>
              <div style={{ padding: '25px 40px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '18px', background: 'rgba(255,255,255,0.01)' }} className="chat-header">
                <button 
                  className="mobile-back-btn" 
                  onClick={() => setCurrentChat(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px 0' }}
                >
                  <FiArrowLeft size={24} />
                </button>
                {(() => {
                  const friend = currentChat.participants.find(p => p._id !== contextUserId);
                  const isFriendOnline = isUserOnline(friend?._id);
                  return (
                    <>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--accent)', overflow: 'hidden' }}>
                          <img src={friend?.profileImage?.url ? getFullUrl(friend.profileImage.url) : 'https://via.placeholder.com/50'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '1.2rem' }}>{friend?.name}</div>
                        <div style={{ color: isFriendOnline ? '#22c55e' : '#222', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiActivity size={10} /> {isFriendOnline ? 'ONLINE_READY' : 'OFFLINE_STANDBY'}
                        </div>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer' }}><FiMoreVertical size={20} /></button>
                    </>
                  );
                })()}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <AnimatePresence>
                  {messages.map((m, i) => {
                    const isMe = m.sender === contextUserId;
                    return (
                      <motion.div
                        key={m._id || i}
                        initial={{ opacity: 0, scale: 0.9, x: isMe ? 20 : -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '65%',
                          background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                          color: '#fff',
                          padding: '16px 24px',
                          borderRadius: isMe ? '25px 25px 5px 25px' : '25px 25px 25px 5px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          lineHeight: '1.5',
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.03)',
                          boxShadow: isMe ? '0 10px 30px var(--accent-glow)' : 'none'
                        }}
                      >
                        {m.text}
                        <div style={{
                          fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.5)' : '#444', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '8px', fontWeight: '700'
                        }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (m.isRead ? <FiCheckCircle size={14} color="#fff" /> : <FiCheck size={14} />)}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '30px 40px', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <input
                  type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '25px', padding: '20px 30px', color: '#fff', outline: 'none', fontSize: '1rem', fontWeight: '500' }}
                />
                <motion.button
                  type="submit" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 10px 25px var(--accent-glow)' }}
                >
                  <FiSend />
                </motion.button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}>
                <FiMessageSquare size={80} color="#111" />
              </motion.div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#222', marginTop: '30px', letterSpacing: '4px' }}>เริ่มบทสนทนา...</div>
              <p style={{ color: '#111', marginTop: '10px', fontSize: '0.9rem', fontWeight: '700' }}>Ready for connection and real-time collaboration.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .messenger-container {
          width: 1280px;
          max-width: calc(100vw - 80px);
          height: 85vh;
          display: flex;
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 40px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .messenger-sidebar {
          width: 400px;
          border-right: 1px solid rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.01);
        }
        .messenger-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #050505;
        }
        .mobile-back-btn {
          display: none;
        }

        @media (max-width: 992px) {
          .messenger-page {
            padding-top: 30px !important;
            padding-bottom: 30px !important;
          }
          .messenger-container {
            max-width: calc(100vw - 40px);
            height: calc(100vh - 120px);
            border-radius: 20px;
          }
          .messenger-sidebar {
            width: 100%;
            border-right: none;
          }
          .messenger-chat {
            display: none;
          }
          .chat-active .messenger-sidebar {
            display: none;
          }
          .chat-active .messenger-chat {
            display: flex;
            width: 100%;
          }
          .mobile-back-btn {
            display: block;
          }
          .chat-header {
            padding: 15px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Messenger;
