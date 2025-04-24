// components/PublishForm.js
import React, { useState, useEffect } from "react";
import "./PublishForm.css";

function PublishForm({ initialTopic, onPublish }) {
    const [topic, setTopic] = useState("");
    const [message, setMessage] = useState("");
    const [format, setFormat] = useState("json");
    const [qos, setQos] = useState(0);
    const [retain, setRetain] = useState(false);

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

        onPublish(topic, message, format, { qos, retain });

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

    const formatJsonMessage = () => {
        if (format === "json") {
            try {
                const parsed = JSON.parse(message);
                const formatted = JSON.stringify(parsed, null, 2);
                setMessage(formatted);
            } catch (e) {
                // Not valid JSON, do nothing
            }
        }
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
                <div className="format-button" onClick={formatJsonMessage}>
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
                <div className="publish-options">
                    <div className="qos-control">
                        <label>QoS</label>
                        <select
                            className="qos-select"
                            value={qos}
                            onChange={(e) => setQos(Number(e.target.value))}
                        >
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </select>
                    </div>

                    <label className="retain-control">
                        <input
                            type="checkbox"
                            checked={retain}
                            onChange={(e) => setRetain(e.target.checked)}
                        />
                        <span>retain</span>
                    </label>
                </div>

                <button type="submit" className="publish-button">
                    <i className="fas fa-paper-plane"></i>
                    PUBLISH
                </button>
            </div>
        </form>
    );
}

export default PublishForm;
