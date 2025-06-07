import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
    message: string;
    isVisible: boolean;
    mood?: 'happy' | 'thinking' | 'error';
}

export const CodeChanSpeechBubble: React.FC<SpeechBubbleProps> = ({
    message,
    isVisible,
    mood = 'happy'
}) => {
    const bubbleVariants = {
        initial: { 
            opacity: 0, 
            scale: 0.8, 
            y: 20,
            x: -20 
        },
        animate: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        },
        exit: { 
            opacity: 0, 
            scale: 0.8, 
            y: -20,
            transition: { 
                duration: 0.2 
            }
        }
    };

    const getMoodStyles = () => {
        switch(mood) {
            case 'error':
                return 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700';
            case 'thinking':
                return 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700';
            default:
                return 'bg-purple-50 border-purple-200 dark:bg-purple-900 dark:border-purple-700';
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={`speech-bubble ${getMoodStyles()} p-4 rounded-lg shadow-lg border-2`}
                    variants={bubbleVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <motion.p 
                        className="text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {message}
                    </motion.p>
                    
                    {/* Эмодзи индикатор настроения */}
                    <motion.span
                        className="absolute top-2 right-2 text-xs"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        {mood === 'error' ? '😅' : mood === 'thinking' ? '🤔' : '✨'}
                    </motion.span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
