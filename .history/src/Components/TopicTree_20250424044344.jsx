// components/TopicTree.js
import React, { useState } from "react";

function TopicTree({ topics, messages, onSelectTopic, selectedTopic }) {
    const [expandedTopics, setExpandedTopics] = useState({});

    const toggleTopic = (topic) => {
        setExpandedTopics((prev) => ({
            ...prev,
            [topic]: !prev[topic],
        }));
    };

    const renderTopicNode = (name, node, path = "") => {
        const fullPath = path ? `${path}/${name}` : name;
        const isExpanded = expandedTopics[fullPath];
        const hasChildren = Object.keys(node).length > 0;
        const hasMessages = messages[fullPath] && messages[fullPath].length > 0;
        const isSelected = selectedTopic === fullPath;

        return (
            <li
                key={fullPath}
                className={`topic-item ${isExpanded ? "expanded" : ""} ${
                    isSelected ? "selected" : ""
                }`}
            >
                <div
                    className="topic-header"
                    onClick={() => {
                        if (hasChildren) {
                            toggleTopic(fullPath);
                        }
                        onSelectTopic(fullPath);
                    }}
                >
                    <span className="toggle-icon">
                        {hasChildren ? (isExpanded ? "▼" : "▶") : " "}
                    </span>
                    <span className="topic-name">{name}</span>
                    {hasMessages && (
                        <span className="topic-info">
                            ({messages[fullPath].length} messages)
                        </span>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <ul className="subtopic-list">
                        {Object.entries(node).map(([childName, childNode]) =>
                            renderTopicNode(childName, childNode, fullPath)
                        )}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className="topic-tree">
            <ul className="topic-list">
                {Object.entries(topics).map(([topicName, topicNode]) =>
                    renderTopicNode(topicName, topicNode)
                )}
            </ul>
        </div>
    );
}

export default TopicTree;
