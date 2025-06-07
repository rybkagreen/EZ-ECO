export type CodeChanMood = 'happy' | 'thinking' | 'surprised' | 'error' | 'sleeping' | 'coding' | 'explaining' | 'working' | 'sad';

export interface CodeChanState {
    mood: CodeChanMood;
    message?: string;
    isWaving: boolean;
    isCoding: boolean;
    isExplaining: boolean;
}

export const defaultCodeChanState: CodeChanState = {
    mood: 'happy',
    isWaving: false,
    isCoding: false,
    isExplaining: false
};

export interface CodeChanAnimation {
    initial?: any;
    animate?: any;
    transition?: any;
}

export const codeChanAnimations: Record<CodeChanMood, CodeChanAnimation> = {
    happy: {
        initial: { y: 0 },
        animate: { y: [-5, 5] },
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
        }
    },
    thinking: {
        initial: { rotate: 0 },
        animate: { rotate: [-5, 5] },
        transition: {
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
        }
    },
    surprised: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.2, 1] },
        transition: {
            duration: 0.5,
            times: [0, 0.5, 1]
        }
    },
    error: {
        initial: { x: 0 },
        animate: { x: [-5, 5, -5, 5, 0] },
        transition: {
            duration: 0.5,
            times: [0, 0.25, 0.5, 0.75, 1]
        }
    },
    sleeping: {
        initial: { y: 0 },
        animate: { y: [0, 2] },
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
        }
    },
    coding: {
        initial: { x: 0 },
        animate: { x: [-2, 2] },
        transition: {
            duration: 0.2,
            repeat: Infinity,
            repeatType: "reverse" as const
        }
    },
    explaining: {
        initial: { scale: 1 },
        animate: { scale: [1, 1.05] },
        transition: {
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
        }
    },
    working: {
        initial: { rotate: 0 },
        animate: { rotate: [0, 5, -5, 0] },
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
        }
    },
    sad: {
        initial: { y: 0 },
        animate: { y: [0, 2] },
        transition: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
        }
    }
};

export const getRandomEncouragement = (): string => {
    const encouragements = [
        "Отличная работа! ٩(◕‿◕｡)۶",
        "Давай сделаем это вместе! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
        "У тебя получается! (◠‿◠✿)",
        "Я помогу тебе разобраться! ⭐️",
        "Это интересная задача! (๑˃ᴗ˂)ﻭ",
        "Ты на верном пути! ♪(๑ᴖ◡ᴖ๑)♪",
        "Продолжай в том же духе! (｀・ω・´)",
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
};

export const getRandomTip = (): string => {
    const tips = [
        "Не забудь сохранить изменения! 💾",
        "Проверь синтаксис перед коммитом! 🔍",
        "Может добавить комментарии к коду? 📝",
        "Не хочешь сделать коммит? 🌟",
        "Я могу помочь с анализом файлов! 🤖",
        "Давай проверим производительность? 🚀",
        "Может быть, стоит добавить тесты? ✨",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
};
