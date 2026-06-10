import { customConfirm } from '../utils/customConfirm';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../utils/api';
import { getFullUrl } from '../utils/mediaUtils';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiGlobe,
  FiSearch,
  FiTarget,
  FiTrash2,
  FiUserPlus,
  FiUsers,
  FiX,
  FiZap,
} from 'react-icons/fi';
import ProfileFrame from '../components/ProfileFrame';
import { useSocket } from '../context/SocketContext';
import PremiumLoader from '../components/PremiumLoader';
import '../css/Friends.css';

const toDisplayText = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return fallback;
  return String(value.name || value.label || value.title || value.category || value.level || value.rank || value._id || value.id || fallback);
};

function Friends() {
  const { user: contextUser, token: contextToken } = useContext(AuthContext);
  const currentToken = contextToken || window.safeStorage.getItem('userToken') || window.safeStorage.getItem('token');
  const currentUser = contextUser || JSON.parse(window.safeStorage.getItem('userInfo') || '{}');
  const { socket } = useSocket();

  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const myId = currentUser?._id || currentUser?.id;
        if (!myId || !currentToken) return;

        const profileData = await usersAPI.getPublicProfile(myId);
        setFriends(profileData.user?.friends || []);

        const reqs = await usersAPI.getMyFriendRequests(currentToken);
        setFriendRequests(reqs || []);
      } catch (err) {
        console.error('Friends load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);

    if (socket) {
      const handleRequestReceived = (data) => {
        setFriendRequests((prev) => [data, ...prev]);
      };
      const handleRequestAccepted = (newFriend) => {
        setFriends((prev) => [...prev, newFriend]);
        setFriendRequests((prev) => prev.filter((request) => request.from?._id !== newFriend._id));
      };
      const handleFriendRemoved = ({ friendId }) => {
        setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
      };

      socket.on('friend_request_received', handleRequestReceived);
      socket.on('friend_request_accepted', handleRequestAccepted);
      socket.on('friend_removed', handleFriendRemoved);

      return () => {
        socket.off('friend_request_received', handleRequestReceived);
        socket.off('friend_request_accepted', handleRequestAccepted);
        socket.off('friend_removed', handleFriendRemoved);
      };
    }
  }, [currentToken, socket]);

  const acceptRequest = async (requesterId, requesterName, requesterAvatar, requesterRank, requesterPoints) => {
    try {
      await usersAPI.respondFriendRequest(requesterId, 'accept', currentToken);
      setFriendRequests((prev) => prev.filter((request) => request.from._id !== requesterId));
      setFriends((prev) => [...prev, {
        _id: requesterId,
        name: requesterName,
        profileImage: requesterAvatar,
        rank: requesterRank,
        points: requesterPoints,
      }]);
    } catch (err) {
      toast.error(`Unable to accept request: ${err?.response?.data?.message || err.message}`);
    }
  };

  const rejectRequest = async (requesterId) => {
    try {
      await usersAPI.respondFriendRequest(requesterId, 'reject', currentToken);
      setFriendRequests((prev) => prev.filter((request) => request.from._id !== requesterId));
    } catch (err) {
      toast.error('Unable to reject request.');
    }
  };

  const removeFriend = async (friendId, friendName) => {
    if (!await customConfirm(`Remove ${friendName} from your friends?`)) return;
    try {
      await usersAPI.removeFriend(friendId, currentToken);
      setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
    } catch (err) {
      toast.error('Unable to remove friend.');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await usersAPI.searchUsers(query, currentToken);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (targetId) => {
    try {
      await usersAPI.sendFriendRequest(targetId, currentToken);
      setSentRequests((prev) => new Set([...prev, targetId]));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to send friend request.');
    }
  };

  if (loading && !friends.length) {
    return <PremiumLoader text="Loading Friends..." subtext="Preparing your creator network." />;
  }

  const friendIds = new Set(friends.map((friend) => friend._id));
  const tabs = [
    { id: 'search', label: 'Find friends', count: searchResults.length, icon: <FiSearch /> },
    { id: 'requests', label: 'Requests', count: friendRequests.length, icon: <FiUserPlus /> },
    { id: 'friends', label: 'Friends', count: friends.length, icon: <FiUsers /> },
  ];

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.045 } } };
  const itemVariants = { hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <main className="friends-page">
      <header className="friends-hero">
        <div className="friends-hero-copy">
          <div className="friends-kicker"><FiGlobe size={16} /><span>Friend Station</span></div>
          <h1>Friends</h1>
          <p>Build your creator network, manage requests, and keep frequent collaborators one click away.</p>
        </div>
        <div className="friends-hero-hud">
          <span>Network</span>
          <strong>{friends.length}</strong>
        </div>
      </header>

      <section className="friends-stats-grid" aria-label="Friends summary">
        <div className="friends-stat-card"><span>Friends</span><strong>{friends.length}</strong></div>
        <div className="friends-stat-card is-orange"><span>Pending</span><strong>{friendRequests.length}</strong></div>
        <div className="friends-stat-card is-blue"><span>Search results</span><strong>{searchResults.length}</strong></div>
      </section>

      <section className="friends-board">
        <div className="friends-board-header">
          <div>
            <div className="friends-kicker"><FiZap size={15} /><span>Social Hub</span></div>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
          </div>
          <span>{tabs.find((tab) => tab.id === activeTab)?.count || 0} items</span>
        </div>

        <div className="friends-tabs" role="tablist" aria-label="Friends sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'active' : ''}
            >
              {tab.icon}<span>{tab.label}</span><strong>{tab.count}</strong>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={containerVariants} initial="hidden" animate="show" exit="hidden">
            {activeTab === 'search' && (
              <SearchPanel
                searchQuery={searchQuery}
                searchLoading={searchLoading}
                searchResults={searchResults}
                friendIds={friendIds}
                sentRequests={sentRequests}
                itemVariants={itemVariants}
                onSearch={handleSearch}
                onSendRequest={sendFriendRequest}
              />
            )}

            {activeTab === 'requests' && (
              <RequestsPanel
                requests={friendRequests}
                itemVariants={itemVariants}
                onAccept={acceptRequest}
                onReject={rejectRequest}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsPanel
                friends={friends}
                itemVariants={itemVariants}
                onRemove={removeFriend}
                onFind={() => setActiveTab('search')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

function SearchPanel({ searchQuery, searchLoading, searchResults, friendIds, sentRequests, itemVariants, onSearch, onSendRequest }) {
  return (
    <div className="friends-panel">
      <div className="friends-search-box">
        <FiSearch size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search creator name or role..."
        />
        {searchLoading && <PremiumLoader bare size="small" />}
      </div>

      {searchResults.length > 0 ? (
        <div className="friends-grid">
          {searchResults.map((user) => {
            const isFriend = friendIds.has(user._id);
            const isSent = sentRequests.has(user._id);
            return (
              <PersonRow
                key={user._id}
                person={user}
                itemVariants={itemVariants}
                meta={isFriend ? 'Already friends' : isSent ? 'Request sent' : 'Available to connect'}
                action={isFriend ? 'friend' : isSent ? 'sent' : 'add'}
                onAction={() => onSendRequest(user._id)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<FiTarget size={34} />} title="Search the network" text="Type a creator name, role, or keyword to find people to connect with." />
      )}
    </div>
  );
}

function RequestsPanel({ requests, itemVariants, onAccept, onReject }) {
  if (requests.length === 0) {
    return <EmptyState icon={<FiUserPlus size={34} />} title="No pending requests" text="Friend requests will appear here when creators invite you to connect." />;
  }

  return (
    <div className="friends-list">
      {requests.map((request) => {
        const sender = request.from || {};
        return (
          <PersonRow
            key={request._id || sender._id}
            person={sender}
            itemVariants={itemVariants}
            meta="Wants to connect with you"
            action="request"
            onAccept={() => onAccept(sender._id, sender.name, sender.profileImage, sender.rank, sender.points)}
            onReject={() => onReject(sender._id)}
          />
        );
      })}
    </div>
  );
}

function FriendsPanel({ friends, itemVariants, onRemove, onFind }) {
  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<FiUsers size={34} />}
        title="No friends yet"
        text="Start by searching for creators you collaborate with often."
        action={<button type="button" className="friends-primary-btn" onClick={onFind}>Find friends <FiArrowRight size={15} /></button>}
      />
    );
  }

  return (
    <div className="friends-grid">
      {friends.map((friend) => (
        <PersonCard key={friend._id} friend={friend} itemVariants={itemVariants} onRemove={onRemove} />
      ))}
    </div>
  );
}

function PersonRow({ person, itemVariants, meta, action, onAction, onAccept, onReject }) {
  const name = toDisplayText(person.name, 'Unnamed creator');
  const profession = toDisplayText(person.profession, 'Member');
  const rank = toDisplayText(person.rank, 'Bronze');
  const skills = person.skills || [];

  return (
    <motion.article variants={itemVariants} className="friends-row-card">
      <ProfileFrame rank={rank} points={person.points || 0} size="68px" showBadge>
        <img src={person.profileImage?.url ? getFullUrl(person.profileImage.url) : 'https://via.placeholder.com/70'} alt={name} />
      </ProfileFrame>

      <div className="friends-person-copy">
        <Link to={`/profile/${person._id}`}>{name}</Link>
        <p>{profession}</p>
        <span>{meta}</span>
        {skills.length > 0 && (
          <div className="friends-skills">
            {skills.slice(0, 3).map((skill, index) => (
              <em key={`${toDisplayText(skill, 'Skill')}-${index}`}>{toDisplayText(skill, 'Skill')}</em>
            ))}
          </div>
        )}
      </div>

      <div className="friends-actions">
        {action === 'friend' && <span className="friends-status is-green"><FiCheck size={13} /> Friend</span>}
        {action === 'sent' && <span className="friends-status"><FiActivity size={13} /> Sent</span>}
        {action === 'add' && <button type="button" className="friends-icon-btn is-primary" onClick={onAction} aria-label={`Add ${name}`}><FiUserPlus size={17} /></button>}
        {action === 'request' && (
          <>
            <button type="button" className="friends-primary-btn" onClick={onAccept}><FiCheck size={15} /> Accept</button>
            <button type="button" className="friends-icon-btn is-danger" onClick={onReject} aria-label={`Reject ${name}`}><FiX size={17} /></button>
          </>
        )}
      </div>
    </motion.article>
  );
}

function PersonCard({ friend, itemVariants, onRemove }) {
  const name = toDisplayText(friend.name, 'Unnamed creator');
  const profession = toDisplayText(friend.profession, 'Member');
  const rank = toDisplayText(friend.rank, 'Bronze');

  return (
    <motion.article variants={itemVariants} className="friend-card">
      <div className="friend-card-signal"><FiActivity size={14} /></div>
      <ProfileFrame rank={rank} points={friend.points || 0} size="92px" showBadge>
        <img src={friend.profileImage?.url ? getFullUrl(friend.profileImage.url) : 'https://via.placeholder.com/100'} alt={name} />
      </ProfileFrame>
      <h3>{name}</h3>
      <p>{profession}</p>
      <div className="friend-card-actions">
        <Link to={`/profile/${friend._id}`}>Profile</Link>
        <button type="button" onClick={() => onRemove(friend._id, name)} aria-label={`Remove ${name}`}>
          <FiTrash2 size={16} />
        </button>
      </div>
    </motion.article>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="friends-empty-state">
      {icon}
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

export default Friends;
