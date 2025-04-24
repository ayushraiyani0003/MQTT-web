// components/PublishForm.js
import React, { useState, useEffect } from "react";

function PublishForm({ initialTopic, onPublish }) {
    const [topic, setTopic] = useState("");
    const [message, setMessage] = useState("");
    const [format, setFormat] = useState("json");

    // Update topic when initialTopic prop changes
    useEffect(() => {
        if (initialTopic) {
            setTopic(initialTopic);
        }
    }, [initialTopic]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!topic.trim()) {
            alert("Please enter a topic");
            return;
        }

        onPublish(topic, message, format);

        // Don't clear the topic after publishing
        setMessage("");

        // Save recent topics to localStorage
        saveRecentTopic(topic);
    };

    const saveRecentTopic = (topic) => {
        const recentTopics =
            JSON.parse(localStorage.getItem("recentTopics")) || [];
        const updatedTopics = [
            topic,
            ...recentTopics.filter((t) => t !== topic),
        ].slice(0, 10);

        localStorage.setItem("recentTopics", JSON.stringify(updatedTopics));
    };

    return (
        <form className="publish-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <label>Topic</label>
                <div className="topic-input-container">
                    <input
                        type="text"
                        className="topic-input"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic"
                    />
                    <button
                        type="button"
                        className="clear-button"
                        onClick={() => setTopic("")}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div className="form-row message-type-selector">
                <div className="message-types">
                    <label className="message-type">
                        <input
                            type="radio"
                            name="messageType"
                            value="raw"
                            checked={format === "raw"}
                            onChange={() => setFormat("raw")}
                        />
                        <span>raw</span>
                    </label>
                    <label className="message-type">
                        <input
                            type="radio"
                            name="messageType"
                            value="xml"
                            checked={format === "xml"}
                            onChange={() => setFormat("xml")}
                        />
                        <span>xml</span>
                    </label>
                    <label className="message-type">
                        <input
                            type="radio"
                            name="messageType"
                            value="json"
                            checked={format === "json"}
                            onChange={() => setFormat("json")}
                        />
                        <span>json</span>
                    </label>
                </div>
                <div className="format-button">
                    <i className="fas fa-align-left"></i>
                </div>
            </div>

            <div className="form-row">
                <textarea
                    className="message-content"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter message to publish"
                />
            </div>

            <div className="form-row publish-controls">
                <button type="submit" className="publish-button">
                    <i className="fas fa-paper-plane"></i>
                    PUBLISH
                </button>
            </div>
        </form>
    );
}

export default PublishForm;
