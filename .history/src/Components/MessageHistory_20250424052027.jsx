// components/MessageHistory.js
import React from "react";
import "./MessageHistory.css";

function MessageHistory({ messages }) {
    if (!messages || messages.length === 0) {
        return <div className="empty-history">No messages available</div>;
    }

    return (
        <div className="message-history-container">
            <div className="section-tab">
                <span className="tab-icon">▶</span>
                <span className="tab-title">History</span>
            </div>
            <div className="message-history">
                {messages.map((msg, index) => (
                    <div key={index} className="message-item">
                        <div className="message-header">
                            {new Date(msg.timestamp).toLocaleString()}
                        </div>
                        <div className="message-content">
                            <pre>{formatMessage(msg.content, msg.format)}</pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper function to format message based on its type
function formatMessage(content, format) {
    if (format === "json") {
        try {
            return JSON.stringify(JSON.parse(content), null, 2);
        } catch (e) {
            return e;
        }
    }
    return content;
}

export default MessageHistory;
