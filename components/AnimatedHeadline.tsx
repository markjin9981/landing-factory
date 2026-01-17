import React, { useEffect, useState, useMemo } from 'react';
import { HeadlineEffect, TextStyle } from '../types';

interface AnimatedHeadlineProps {
    text: string;
    effect: HeadlineEffect;
    style?: TextStyle;
    className?: string;
    duration?: number; // ms
    isLoop?: boolean;
}

// Inner component that handles the actual animation
const AnimatedHeadlineContent: React.FC<AnimatedHeadlineProps> = ({
    text,
    effect,
    style,
    className = '',
    duration = 1000
}) => {
    const [displayText, setDisplayText] = useState('');
    const [isVisible, setIsVisible] = useState(effect === 'none');

    // Parse text for line breaks
    const lines = text.split('\n');

    // Typewriter effect
    useEffect(() => {
        if (effect === 'typewriter') {
            setDisplayText('');
            let currentIndex = 0;
            const fullText = text;

            // Adjust typing speed based on duration
            const typingSpeed = Math.max(30, Math.min(200, duration / fullText.length));

            const timer = setInterval(() => {
                if (currentIndex <= fullText.length) {
                    setDisplayText(fullText.slice(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(timer);
                }
            }, typingSpeed);

            return () => clearInterval(timer);
        } else {
            setDisplayText(text);
        }
    }, [effect, text, duration]);

    // Trigger visual animation on mount
    useEffect(() => {
        if (effect !== 'none' && effect !== 'typewriter') {
            // Start invisible, then set to true to trigger transition
            setIsVisible(false);
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(true);
        }
    }, [effect]);

    // Build style object
    const textStyleObj: React.CSSProperties = useMemo(() => {
        const obj: React.CSSProperties = {};
        if (style?.fontSize) obj.fontSize = style.fontSize;
        if (style?.fontWeight) obj.fontWeight = style.fontWeight;
        if (style?.color) obj.color = style.color;
        if (style?.textAlign) obj.textAlign = style.textAlign;
        if (style?.letterSpacing) obj.letterSpacing = style.letterSpacing;
        if (style?.fontFamily) obj.fontFamily = style.fontFamily;

        // Gradient support
        if (style?.gradientFrom && style?.gradientTo) {
            const direction = style.gradientDirection || 'to right';
            const via = style.gradientVia ? `, ${style.gradientVia}` : '';
            obj.background = `linear-gradient(${direction}, ${style.gradientFrom}${via}, ${style.gradientTo})`;
            obj.WebkitBackgroundClip = 'text';
            obj.WebkitTextFillColor = 'transparent';
            obj.backgroundClip = 'text';
        }

        return obj;
    }, [style]);

    // Effect-specific classes and styles
    const getEffectStyles = (): { className: string; style: React.CSSProperties } => {
        const baseTransition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

        switch (effect) {
            case 'fadeIn':
                return {
                    className: '',
                    style: {
                        opacity: isVisible ? 1 : 0,
                        transition: baseTransition,
                    }
                };

            case 'slideUp':
                return {
                    className: '',
                    style: {
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(60px)',
                        transition: baseTransition,
                    }
                };

            case 'slideDown':
                return {
                    className: '',
                    style: {
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(-60px)',
                        transition: baseTransition,
                    }
                };

            case 'blur':
                return {
                    className: '',
                    style: {
                        opacity: isVisible ? 1 : 0,
                        filter: isVisible ? 'blur(0px)' : 'blur(20px)',
                        transition: baseTransition,
                    }
                };

            case 'bounce':
                return {
                    className: isVisible ? 'animate-bounce-in' : '',
                    style: {
                        opacity: isVisible ? 1 : 0,
                        animationDuration: `${duration}ms`,
                    }
                };

            case 'scale':
                return {
                    className: '',
                    style: {
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'scale(1)' : 'scale(0.3)',
                        transition: baseTransition,
                    }
                };

            case 'glitch':
                return {
                    className: 'animate-glitch',
                    style: {
                        animationDuration: `${Math.max(300, duration / 2)}ms`,
                    }
                };

            case 'wave':
            case 'typewriter':
            case 'none':
            default:
                return { className: '', style: {} };
        }
    };

    const effectStyles = getEffectStyles();

    // Wave effect
    if (effect === 'wave') {
        return (
            <div className={className} style={textStyleObj}>
                {lines.map((line, lineIdx) => (
                    <div key={lineIdx}>
                        {line.split('').map((char, charIdx) => (
                            <span
                                key={charIdx}
                                className="inline-block animate-wave"
                                style={{
                                    animationDelay: `${charIdx * 0.05}s`,
                                }}
                            >
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    // Typewriter effect
    if (effect === 'typewriter') {
        const displayLines = displayText.split('\n');
        return (
            <div className={className} style={textStyleObj}>
                {displayLines.map((line, idx) => (
                    <div key={idx}>
                        {line}
                        {idx === displayLines.length - 1 && displayText.length < text.length && (
                            <span className="animate-blink">|</span>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // Standard Render
    return (
        <div
            className={`${className} ${effectStyles.className}`}
            style={{ ...textStyleObj, ...effectStyles.style, width: '100%' }}
        >
            {lines.map((line, idx) => (
                <div key={idx} style={{ textAlign: 'inherit' }}>{line}</div>
            ))}
        </div>
    );
};

// Wrapper Logic for Looping
const AnimatedHeadline: React.FC<AnimatedHeadlineProps> = (props) => {
    const [playKey, setPlayKey] = useState(0);

    useEffect(() => {
        // Reset key when effect changes
        setPlayKey(0);
    }, [props.effect]);

    useEffect(() => {
        if (props.isLoop && props.effect !== 'none') {
            const pauseDuration = 2000;
            const cycleDuration = (props.duration || 1000) + pauseDuration;

            const interval = setInterval(() => {
                setPlayKey(prev => prev + 1);
            }, cycleDuration);

            return () => clearInterval(interval);
        }
    }, [props.isLoop, props.effect, props.duration]);

    return (
        <AnimatedHeadlineContent
            {...props}
            key={`${props.effect}-${playKey}`}
        />
    );
};

export default AnimatedHeadline;

// CSS to add in your global styles or index.css:
/*
@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.animate-bounce-in {
  animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-glitch {
  animation: glitch 0.3s infinite;
}

.animate-wave {
  animation: wave 1s ease-in-out infinite;
}

.animate-blink {
  animation: blink 1s step-end infinite;
}
*/
