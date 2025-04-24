// components/MessageHistory.js
import React, { useRef, useEffect } from "react";
import "./MessageHistory.css";

function MessageHistory({ messages }) {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!messages || messages.length === 0) {
        return (
            <div className="message-history-container empty">
                <div className="section-tab">
                    <span className="tab-icon">📋</span>
                    <span className="tab-title">Message History</span>
                    <span className="message-count">(0)</span>
                </div>
                <div className="empty-history">
                    <div className="empty-icon">📭</div>
                    <p>No messages available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="message-history-container">
            <div className="section-tab">
                <span className="tab-icon">📋</span>
                <span className="tab-title">Message History</span>
                <span className="message-count">({messages.length})</span>
            </div>
            <div className="message-history" ref={scrollRef}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message-item ${
                            msg.format === "json"
                                ? "json-message"
                                : "raw-message"
                        }`}
                    >
                        <div className="message-header">
                            <span className="message-timestamp">
                                {formatTimestamp(msg.timestamp)}
                            </span>
                            <span className="message-format">
                                {msg.format.toUpperCase()}
                            </span>
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
            const parsedJson = JSON.parse(content);
            return JSON.stringify(parsedJson, null, 2);
        } catch (e) {
            return content; // Return raw if parsing fails
        }
    }
    return content;
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    // Format date and time nicely
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default MessageHistory;
