import React from 'react';
import { motion, Variants } from 'framer-motion';
import { CodeChanMood } from './CodeChanTypes';

interface EmotionProps {
    mood: CodeChanMood;
}

interface EyesAnimation {
    initial?: any;
    animate?: any;
    transition?: any;
}

interface MouthAnimation {
    d: string;
    animate?: any;
    transition?: any;
}

interface EmotionVariant {
    eyes: EyesAnimation;
    mouth: MouthAnimation;
}

const emotionVariants: Record<CodeChanMood, EmotionVariant> = {
    happy: {
        eyes: {
            initial: { scaleY: 1 },
            animate: { scaleY: [1, 0.3, 1] },
            transition: { duration: 0.2, repeat: Infinity, repeatDelay: 3 }
        },
        mouth: {
            d: "M15 20 Q 25 25, 35 20",
            animate: { d: ["M15 20 Q 25 25, 35 20", "M15 20 Q 25 28, 35 20"] },
            transition: { duration: 2, repeat: Infinity, repeatType: "reverse" as const }
        }
    },
    thinking: {
        eyes: {
            initial: { scaleY: 1 },
            animate: { scaleY: 0.7 }
        },
        mouth: {
            d: "M20 25 Q 25 25, 30 25",
            animate: { x: [-2, 2] },
            transition: { duration: 1, repeat: Infinity, repeatType: "reverse" as const }
        }
    },
    surprised: {
        eyes: {
            animate: { scale: 1.2 },
            transition: { duration: 0.2 }
        },
        mouth: {
            d: "M20 25 Q 25 30, 30 25",
            animate: { scale: 1.1 }
        }
    },
    error: {
        eyes: {
            animate: { rotate: [-5, 5] },
            transition: { duration: 0.2, repeat: 2 }
        },
        mouth: {
            d: "M20 25 Q 25 20, 30 25",
            animate: { scale: 0.9 }
        }
    },
    sleeping: {
        eyes: {
            animate: { scaleY: 0.1 }
        },
        mouth: {
            d: "M20 25 Q 25 25, 30 25"
        }
    },
    coding: {
        eyes: {
            initial: { scaleY: 1 },
            animate: { scaleY: [1, 0.8, 1] },
            transition: { duration: 0.5, repeat: Infinity }
        },
        mouth: {
            d: "M20 25 Q 25 23, 30 25",
            animate: { x: [-1, 1] },
            transition: { duration: 0.2, repeat: Infinity }
        }
    },
    explaining: {
        eyes: {
            initial: { scaleY: 1 },
            animate: { scaleY: [1, 0.9, 1] },
            transition: { duration: 1, repeat: Infinity }
        },
        mouth: {
            d: "M15 25 Q 25 20, 35 25",
            animate: { d: ["M15 25 Q 25 20, 35 25", "M15 25 Q 25 23, 35 25"] },
            transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" as const }
        }
    },
    working: {
        eyes: {
            initial: { scaleY: 1 },
            animate: { scaleY: [1, 0.6, 1] },
            transition: { duration: 0.8, repeat: Infinity }
        },
        mouth: {
            d: "M20 25 Q 25 22, 30 25",
            animate: { x: [-1, 1] },
            transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" as const }
        }
    },
    sad: {
        eyes: {
            initial: { scaleY: 1 },
            animate: { scaleY: 0.5 }
        },
        mouth: {
            d: "M15 28 Q 25 32, 35 28",
            animate: { d: ["M15 28 Q 25 32, 35 28", "M15 29 Q 25 33, 35 29"] },
            transition: { duration: 2, repeat: Infinity, repeatType: "reverse" as const }
        }
    }
};

export const CodeChanEmotion: React.FC<EmotionProps> = ({ mood }) => {
    const emotion = emotionVariants[mood];

    return (
        <svg width="50" height="50" viewBox="0 0 50 50">
            {/* Глаза */}
            <g>
                <motion.ellipse
                    cx="15"
                    cy="20"
                    rx="3"
                    ry="4"
                    fill="var(--code-chan-eyes)"
                    initial={emotion.eyes.initial}
                    animate={emotion.eyes.animate}
                    transition={emotion.eyes.transition}
                />
                <motion.ellipse
                    cx="35"
                    cy="20"
                    rx="3"
                    ry="4"
                    fill="var(--code-chan-eyes)"
                    initial={emotion.eyes.initial}
                    animate={emotion.eyes.animate}
                    transition={emotion.eyes.transition}
                />
            </g>

            {/* Рот */}
            <motion.path
                d={emotion.mouth.d}
                stroke="var(--code-chan-eyes)"
                strokeWidth="2"
                fill="none"
                animate={emotion.mouth.animate}
                transition={emotion.mouth.transition}
            />

            {/* Румянец (для счастливого состояния) */}
            {mood === 'happy' && (
                <>
                    <circle cx="10" cy="25" r="3" fill="rgba(255, 182, 193, 0.6)" />
                    <circle cx="40" cy="25" r="3" fill="rgba(255, 182, 193, 0.6)" />
                </>
            )}

            {/* Кибер-элементы */}
            <g className="cyber-elements">
                <motion.path
                    d="M5 5 L10 10 M45 5 L40 10"
                    stroke="var(--code-chan-cyber)"
                    strokeWidth="1"
                    className="cyber-glow"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </g>
        </svg>
    );
};
