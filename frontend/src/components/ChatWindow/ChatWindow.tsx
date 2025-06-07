import React, { useState, useEffect } from 'react';
import { CodeChan } from '../CodeChan/CodeChan';
import { CodeChanMood } from '../CodeChan/CodeChanTypes';
import './ChatWindow.css';

interface ChatWindowProps {
    onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
    const [message, setMessage] = useState('Привет! Я Code Chan! Как дела с файлами? 😸');
    const [mood, setMood] = useState<CodeChanMood>('happy');
    const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'chan', text: string}>>([
        { type: 'chan', text: 'Привет! Я Code Chan! Как дела с файлами? 😸' }
    ]);
    const [userInput, setUserInput] = useState('');

    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        // Добавляем сообщение пользователя
        setChatHistory(prev => [...prev, { type: 'user', text: userInput }]);

        // Простые ответы Code Chan
        const responses = [
            'Отличный вопрос! 🤔',
            'Хммм, дай-ка подумать... 💭',
            'Ого, интересно! ✨',
            'Я помогу с этим! 💪',
            'Это легко решается! 😊',
            'Отличная идея! 🎉'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setTimeout(() => {
            setChatHistory(prev => [...prev, { type: 'chan', text: randomResponse }]);
            setMessage(randomResponse);
        }, 500);

        setUserInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-title">
                    <span className="chat-icon">💬</span>
                    <span>Code Chan Chat</span>
                </div>
                <button className="chat-close" onClick={onClose}>×</button>
            </div>

            <div className="chat-content">
                <div className="code-chan-container">
                    <CodeChan message={message} mood={mood} />
                </div>

                <div className="chat-history">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.type}`}>
                            <div className="message-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-input">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Напишите сообщение Code Chan..."
                    className="chat-input-field"
                />
                <button 
                    onClick={handleSendMessage}
                    className="chat-send-btn"
                    disabled={!userInput.trim()}
                >
                    ↗️
                </button>
            </div>
        </div>
    );
};
