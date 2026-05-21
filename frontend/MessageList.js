import React, { useEffect, useState } from 'react';
import { handleSelfDestructingMessages, decryptMessage } from './messageService';

const MessageList = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessages(prevMessages => handleSelfDestructingMessages(prevMessages));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            {messages.map(message => (
                <div key={message.id}>
                    {decryptMessage(message.content)}
                </div>
            ))}
        </div>
    );
};

export default MessageList;