import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CodeChanMood, 
    CodeChanState, 
    defaultCodeChanState,
    codeChanAnimations,
    getRandomEncouragement,
    getRandomTip
} from './CodeChanTypes';
import { CodeChanEmotion } from './CodeChanEmotion';
import { CodeChanSpeechBubble } from './CodeChanSpeechBubble';
import './CodeChan.css';

interface CodeChanProps {
    mood?: CodeChanMood;
    message?: string;
    onInteract?: (state: CodeChanState) => void;
    enableAutoActions?: boolean;
}

export const CodeChan: React.FC<CodeChanProps> = ({ 
    mood = 'happy', 
    message,
    onInteract,
    enableAutoActions = true 
}) => {
    const [state, setState] = useState<CodeChanState>({
        ...defaultCodeChanState,
        mood
    });
    const [isWaving, setIsWaving] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoMessage, setAutoMessage] = useState<string>('');

    const handleInteraction = useCallback(() => {
        const newState = {
            ...state,
            isWaving: true
        };
        setState(newState);
        onInteract?.(newState);
        
        // Случайное сообщение при взаимодействии
        setAutoMessage(Math.random() > 0.5 ? getRandomEncouragement() : getRandomTip());
        setIsSpeaking(true);
        
        setTimeout(() => {
            setIsWaving(false);
            setState(prev => ({ ...prev, isWaving: false }));
        }, 2000);
    }, [state, onInteract]);

    useEffect(() => {
        if (enableAutoActions) {
            const interval = setInterval(() => {
                const shouldAct = Math.random() > 0.7;
                if (shouldAct) {
                    const actions = ['wave', 'speak', 'animate'];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    
                    switch(randomAction) {
                        case 'wave':
                            setIsWaving(true);
                            setTimeout(() => setIsWaving(false), 2000);
                            break;
                        case 'speak':
                            setAutoMessage(getRandomTip());
                            setIsSpeaking(true);
                            break;
                        case 'animate':
                            setState(prev => ({
                                ...prev,
                                mood: ['happy', 'thinking', 'coding'][Math.floor(Math.random() * 3)] as CodeChanMood
                            }));
                            break;
                    }
                }
            }, 10000);
            
            return () => clearInterval(interval);
        }
    }, [enableAutoActions]);

    useEffect(() => {
        // Случайные действия
        const randomAction = () => {
            const shouldWave = Math.random() > 0.7;
            if (shouldWave) {
                setIsWaving(true);
                setTimeout(() => setIsWaving(false), 2000);
            }
        };

        const actionInterval = setInterval(randomAction, 5000);
        return () => clearInterval(actionInterval);
    }, []);

    useEffect(() => {
        if (message) {
            setIsSpeaking(true);
            const timer = setTimeout(() => setIsSpeaking(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <motion.div
            className="code-chan-container"
            initial={codeChanAnimations[mood].initial}
            animate={codeChanAnimations[mood].animate}
            transition={codeChanAnimations[mood].transition}
        >
            {/* Code Chan изображение */}
            <motion.img
                src="/code_chan.svg"
                alt="Code Chan - милый котик программист"
                className="code-chan-image"
                animate={isWaving ? { rotate: [0, 15, -15, 0] } : {}}
                transition={{ duration: 0.5 }}
                onClick={handleInteraction}
                style={{ cursor: 'pointer', width: '128px', height: '128px' }}
            />

            {/* Сообщение */}
            <AnimatePresence>
                {isSpeaking && message && (
                    <motion.div
                        className="speech-bubble bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-sm text-gray-800 dark:text-gray-200">{message}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
