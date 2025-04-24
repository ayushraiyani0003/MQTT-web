// components/ContentPanel.js
import React, { useState } from "react";
import TopicPath from "./TopicPath";
import MessageHistory from "./MessageHistory";
import PublishForm from "./PublishForm";

function ContentPanel({ selectedTopic, messages, onPublish }) {
    const [sections, setSections] = useState({
        topic: true,
        value: true,
        publish: true,
        stats: true,
    });

    const toggleSection = (section) => {
        setSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="content-panels">
            {/* Topic Section */}
            <div className="content-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection("topic")}
                >
                    <div className="section-title">Topic</div>
                    <div className="section-controls">
                        <i
                            className={`fas fa-chevron-${
                                sections.topic ? "up" : "down"
                            }`}
                        ></i>
                    </div>
                </div>
                {sections.topic && (
                    <div className="section-body">
                        <TopicPath topic={selectedTopic} />
                    </div>
                )}
            </div>

            {/* Value Section */}
            <div className="content-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection("value")}
                >
                    <div className="section-title">Value</div>
                    <div className="section-controls">
                        <i
                            className={`fas fa-chevron-${
                                sections.value ? "up" : "down"
                            }`}
                        ></i>
                    </div>
                </div>
                {sections.value && (
                    <div className="section-body">
                        <MessageHistory messages={messages} />
                    </div>
                )}
            </div>

            {/* Publish Section */}
            <div className="content-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection("publish")}
                >
                    <div className="section-title">Publish</div>
                    <div className="section-controls">
                        <i
                            className={`fas fa-chevron-${
                                sections.publish ? "up" : "down"
                            }`}
                        ></i>
                    </div>
                </div>
                {sections.publish && (
                    <div className="section-body">
                        <PublishForm
                            initialTopic={selectedTopic}
                            onPublish={onPublish}
                        />
                    </div>
                )}
            </div>

            {/* Stats Section */}
            <div className="content-section">
                <div
                    className="section-header"
                    onClick={() => toggleSection("stats")}
                >
                    <div className="section-title">Stats</div>
                    <div className="section-controls">
                        <i
                            className={`fas fa-chevron-${
                                sections.stats ? "up" : "down"
                            }`}
                        ></i>
                    </div>
                </div>
                {sections.stats && (
                    <div className="section-body">
                        <div className="stats-info">
                            <div className="stat-row">
                                <span className="stat-label">Messages:</span>
                                <span className="stat-value">
                                    #{(selectedTopic && messages.length) || 0}
                                </span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Subtopics:</span>
                                <span className="stat-value">
                                    {selectedTopic
                                        ? countSubtopics(selectedTopic)
                                        : 0}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Helper function to count subtopics (would need to be implemented with actual topic structure)
    function countSubtopics(topic) {
        return 3; // Example placeholder
    }
}

export default ContentPanel;
