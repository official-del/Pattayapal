import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const CustomSelect = ({ value, onChange, options, placeholder = "Select an option", style }) => {
   const [isOpen, setIsOpen] = useState(false);
   const containerRef = useRef(null);

   const selectedOption = options.find(opt => opt.value === value);

   useEffect(() => {
      const handleClickOutside = (event) => {
         if (containerRef.current && !containerRef.current.contains(event.target)) {
            setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handleSelect = (val) => {
      onChange(val);
      setIsOpen(false);
   };

   return (
      <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 100 : 1, ...style }}>
         <div 
            onClick={() => setIsOpen(!isOpen)}
            style={{ 
               background: 'rgba(255,255,255,0.02)', 
               border: isOpen ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.05)', 
               padding: '18px', 
               borderRadius: '15px', 
               color: value && selectedOption ? '#fff' : '#666', 
               cursor: 'pointer',
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               transition: '0.2s',
               boxShadow: isOpen ? '0 0 15px rgba(255,87,51,0.1)' : 'none'
            }}
         >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
               {selectedOption ? selectedOption.label : placeholder}
            </span>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
               <FiChevronDown size={18} color={isOpen ? 'var(--accent)' : '#666'} />
            </motion.div>
         </div>

         <AnimatePresence>
            {isOpen && (
               <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                     position: 'absolute',
                     top: '100%',
                     left: 0,
                     right: 0,
                     marginTop: '10px',
                     background: '#111',
                     border: '1px solid rgba(255,255,255,0.1)',
                     borderRadius: '15px',
                     boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                     zIndex: 100,
                     maxHeight: '250px',
                     overflowY: 'auto',
                     display: 'flex',
                     flexDirection: 'column',
                     padding: '10px'
                  }}
               >
                  {options.map((opt) => (
                     <div
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        style={{
                           padding: '12px 15px',
                           borderRadius: '10px',
                           cursor: 'pointer',
                           color: value === opt.value ? 'var(--accent)' : '#fff',
                           background: value === opt.value ? 'rgba(255,87,51,0.1)' : 'transparent',
                           fontWeight: value === opt.value ? '700' : '500',
                           transition: '0.2s',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                           if (value !== opt.value) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                           }
                        }}
                        onMouseLeave={(e) => {
                           if (value !== opt.value) {
                              e.currentTarget.style.background = 'transparent';
                           }
                        }}
                     >
                        {opt.label}
                        {value === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></div>}
                     </div>
                  ))}
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default CustomSelect;
