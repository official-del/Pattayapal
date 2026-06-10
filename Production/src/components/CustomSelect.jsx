import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  style,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`pp-custom-select ${isOpen ? 'is-open' : ''} ${className}`.trim()}
      style={style}
    >
      <button
        type="button"
        className={`pp-custom-select-trigger ${selectedOption ? '' : 'is-placeholder'}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.span
          className="pp-custom-select-chevron"
          animate={shouldReduceMotion ? undefined : { rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <FiChevronDown />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="pp-custom-select-menu"
            role="listbox"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {options.map((option) => {
              const selected = value === option.value;

              return (
                <button
                  type="button"
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  className={`pp-custom-select-option ${selected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {selected && <FiCheck />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
