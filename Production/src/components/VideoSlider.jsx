import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { worksAPI } from '../utils/api'; 
import { FiArrowRight, FiArrowLeft, FiPlay, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:5000"; 

function VideoSlider() {
    const [slides, setSlides] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const videoRefs = useRef([]);
    const sliderRef = useRef(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const res = await worksAPI.getAll();
                const videoData = (res.works || []).filter(w => w.type === 'video' && w.status === 'published' && w.showOnSlider);
                setSlides(videoData);
            } catch (err) {
                console.error('Failed to fetch videos:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const getMediaUrl = (work) => {
        let path = work.mediaUrl || work.mainImage?.url;
        if (!path || path === "" || path === "null") return null; 
        if (path.startsWith('http')) return path;
        const cleanPath = path.replace(/^\/+/, ''); 
        return `${API_URL}/${cleanPath.startsWith('uploads') ? cleanPath : 'uploads/' + cleanPath}`;
    };

    useEffect(() => {
        if (slides.length === 0 || loading) return;
        videoRefs.current.forEach((video, i) => {
            if (!video) return;
            if (i === current) {
                video.muted = true;
                video.currentTime = 0;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, [current, slides, loading]);

    const goTo = useCallback((index) => {
        if (slides.length === 0) return;
        const total = slides.length;
        setCurrent((index + total) % total);
    }, [slides.length]);

    if (loading) return (
        <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );
    if (slides.length === 0) return null;

    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
            <AnimatePresence mode="wait">
                {slides.map((slide, i) => i === current && (
                    <motion.div 
                        key={slide._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        style={{ position: 'absolute', inset: 0 }}
                    >
                        <video
                            ref={(el) => (videoRefs.current[i] = el)}
                            src={getMediaUrl(slide)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                            loop muted playsInline preload="auto"
                        />
                        
                        {/* 🌌 Cinematic Overlays */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.4))' }} />
                        
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8%' }}>
                            <div style={{ maxWidth: '900px' }}>
                                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                                    <span style={{ color: 'var(--accent)', fontWeight: '700', letterSpacing: '6px', fontSize: '0.9rem', display: 'block', marginBottom: '20px' }}>FEATURED_PROJECT</span>
                                    <h2 style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', fontWeight: '700', margin: 0, lineHeight: 0.9, letterSpacing: '-4px', color: '#fff' }}>{slide.title}</h2>
                                    <p style={{ fontSize: '1.4rem', color: '#ccc', marginTop: '30px', maxWidth: '600px', lineHeight: 1.6, fontWeight: '400' }}>{slide.description}</p>
                                    
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '50px' }}>
                                        <motion.button 
                                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px var(--accent-glow)' }}
                                            onClick={() => navigate(`/works/${slide._id}`)}
                                            style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '18px 45px', borderRadius: '40px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}
                                        >
                                            <FiPlay fill="#fff" /> ดูผลงานนี้
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                                            onClick={() => navigate('/works')}
                                            className="glass"
                                            style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '18px 45px', borderRadius: '40px', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}
                                        >
                                            สำรวจผลงานทั้งหมด
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 🛠️ Modern Navigation */}
            <div style={{ position: 'absolute', bottom: '60px', right: '8%', display: 'flex', alignItems: 'center', gap: '30px', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => goTo(current - 1)} className="glass" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiArrowLeft size={24} />
                    </button>
                    <button onClick={() => goTo(current + 1)} className="glass" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiArrowRight size={24} />
                    </button>
                </div>
                
                <div style={{ height: '60px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    {slides.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrent(i)}
                            style={{ 
                                width: i === current ? '40px' : '10px', height: '10px', borderRadius: '10px', 
                                background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.2)', 
                                border: 'none', cursor: 'pointer', transition: '0.5s' 
                            }} 
                        />
                    ))}
                </div>
            </div>

            {/* 📟 Slide Counter */}
            <div style={{ position: 'absolute', top: '50%', right: '40px', transform: 'translateY(-50%)', writingMode: 'vertical-rl', mixBlendMode: 'difference' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '5px', color: '#333' }}>
                    0{current + 1} / 0{slides.length}
                </span>
            </div>
        </div>
    )
}

export default VideoSlider;