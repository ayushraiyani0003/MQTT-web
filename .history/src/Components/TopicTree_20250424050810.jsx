// components/TopicTree.js
import React, { useState, useEffect, useRef } from "react";
import "./TopicTree.css";

function TopicTree({ topics, messages, onSelectTopic, selectedTopic }) {
    const [expandedTopics, setExpandedTopics] = useState({});
    const [recentlyUpdated, setRecentlyUpdated] = useState({});
    const previousMessagesRef = useRef({});

    // Track which topics have received new messages
    useEffect(() => {
        const newRecentlyUpdated = { ...recentlyUpdated };
        let hasChanges = false;

        // Check for new messages
        Object.keys(messages).forEach((topic) => {
            if (
                !previousMessagesRef.current[topic] ||
                (messages[topic].length > 0 &&
                    (!previousMessagesRef.current[topic].length ||
                        messages[topic][0].timestamp !==
                            previousMessagesRef.current[topic][0]?.timestamp))
            ) {
                // New message received for this topic
                newRecentlyUpdated[topic] = Date.now();
                hasChanges = true;

                // Auto-expand parent topics when new messages arrive
                const parts = topic.split("/");
                let currentPath = "";
                for (let i = 0; i < parts.length - 1; i++) {
                    currentPath = currentPath
                        ? `${currentPath}/${parts[i]}`
                        : parts[i];
                    setExpandedTopics((prev) => ({
                        ...prev,
                        [currentPath]: true,
                    }));
                }
            }
        });

        // Update state if there are changes
        if (hasChanges) {
            setRecentlyUpdated(newRecentlyUpdated);
        }

        // Store current messages for comparison in next update
        previousMessagesRef.current = JSON.parse(JSON.stringify(messages));

        // Clean up highlight after 500 seconds
        const currentTime = Date.now();
        const highlightTimeout = 500 * 1000; // 500 seconds in milliseconds

        Object.keys(recentlyUpdated).forEach((topic) => {
            if (currentTime - recentlyUpdated[topic] > highlightTimeout) {
                const updatedRecent = { ...recentlyUpdated };
                delete updatedRecent[topic];
                setRecentlyUpdated(updatedRecent);
            }
        });

        // Set cleanup interval
        const intervalId = setInterval(() => {
            const currentTime = Date.now();
            setRecentlyUpdated((prev) => {
                const updated = { ...prev };
                let hasChanges = false;

                Object.keys(updated).forEach((topic) => {
                    if (currentTime - updated[topic] > highlightTimeout) {
                        delete updated[topic];
                        hasChanges = true;
                    }
                });

                return hasChanges ? updated : prev;
            });
        }, 10000); // Check every 10 seconds

        return () => clearInterval(intervalId);
    }, [messages, recentlyUpdated]);

    const toggleTopic = (topic) => {
        setExpandedTopics((prev) => ({
            ...prev,
            [topic]: !prev[topic],
        }));
    };

    // Function to build a tree structure from flat topics
    const buildTopicTree = () => {
        const tree = {};

        // First pass: create the tree structure
        Object.keys(topics).forEach((topicPath) => {
            const parts = topicPath.split("/");
            let currentNode = tree;

            parts.forEach((part) => {
                if (!currentNode[part]) {
                    currentNode[part] = {
                        children: {},
                        lastMessage: null,
                        path: currentNode.path
                            ? `${currentNode.path}/${part}`
                            : part,
                    };
                }
                currentNode = currentNode[part].children;
            });
        });

        // Second pass: add message data
        Object.keys(messages).forEach((topicPath) => {
            if (messages[topicPath] && messages[topicPath].length > 0) {
                const parts = topicPath.split("/");
                let currentNode = tree;
                let currentPath = "";

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;

                    if (currentNode[part]) {
                        if (i === parts.length - 1) {
                            // We're at the leaf node for this topic
                            currentNode[part].lastMessage =
                                messages[topicPath][0]; // Most recent message
                            currentNode[part].messageCount =
                                messages[topicPath].length;
                            currentNode[part].fullPath = topicPath;
                        }
                        currentNode = currentNode[part].children;
                    } else {
                        break;
                    }
                }
            }
        });

        return tree;
    };

    const renderTopicNode = (name, node, path = "") => {
        const currentPath = path ? `${path}.${name}` : name;
        const displayPath = node.fullPath || currentPath.replace(/\./g, "/");
        const isExpanded = expandedTopics[displayPath];
        const hasChildren = Object.keys(node.children || {}).length > 0;
        const hasMessage = node.lastMessage !== null;
        const isSelected = selectedTopic === displayPath;
        const isRecentlyUpdated = recentlyUpdated[displayPath];

        // Classes for visual styling
        const nodeClasses = [
            "topic-item",
            isExpanded ? "expanded" : "",
            isSelected ? "selected" : "",
            isRecentlyUpdated ? "recently-updated" : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <li key={displayPath} className={nodeClasses}>
                <div
                    className="topic-header"
                    onClick={() => {
                        if (hasChildren) {
                            toggleTopic(displayPath);
                        }
                        onSelectTopic(displayPath);
                    }}
                >
                    <span className="toggle-icon">
                        {hasChildren ? (isExpanded ? "▼" : "▶") : " "}
                    </span>
                    <span className="topic-name">{name}</span>
                    {hasMessage && (
                        <span className="topic-info">
                            ({node.messageCount || 0})
                        </span>
                    )}
                    {isRecentlyUpdated && (
                        <span
                            className="update-indicator"
                            title="Recently updated"
                        ></span>
                    )}
                </div>

                {/* Show latest message directly under the topic if expanded */}
                {hasMessage && isExpanded && !hasChildren && (
                    <div className="topic-preview">
                        <pre className="message-preview">
                            {formatMessage(
                                node.lastMessage.content,
                                node.lastMessage.format
                            )}
                        </pre>
                        <div className="message-time">
                            {new Date(
                                node.lastMessage.timestamp
                            ).toLocaleTimeString()}
                        </div>
                    </div>
                )}

                {hasChildren && isExpanded && (
                    <ul className="subtopic-list">
                        {Object.entries(node.children).map(
                            ([childName, childNode]) =>
                                renderTopicNode(
                                    childName,
                                    childNode,
                                    currentPath
                                )
                        )}
                    </ul>
                )}
            </li>
        );
    };

    // Helper function to format message preview
    const formatMessage = (content, format) => {
        if (!content) return "";

        // For preview, limit the content length
        const maxLength = 100;
        let preview = content;

        if (format === "json") {
            try {
                const parsed = JSON.parse(content);
                preview = JSON.stringify(parsed, null, 2);
            } catch (e) {
                // If not valid JSON, use as is
                console.log("Invalid JSON:", e);
            }
        }

        // Truncate if too long
        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength) + "...";
        }

        return preview;
    };

    const topicTree = buildTopicTree();

    return (
        <div className="topic-tree">
            <div className="topic-tree-header">
                <span className="topic-tree-title">Topics</span>
                <div className="topic-tree-actions">
                    <button
                        className="tree-action-button"
                        title="Expand All"
                        onClick={() => {
                            const allTopics = {};
                            const expandAll = (node = topicTree, path = "") => {
                                Object.entries(node).forEach(([key, value]) => {
                                    const currentPath = path
                                        ? `${path}/${key}`
                                        : key;
                                    allTopics[currentPath] = true;
                                    if (value.children) {
                                        expandAll(value.children, currentPath);
                                    }
                                });
                            };
                            expandAll();
                            setExpandedTopics(allTopics);
                        }}
                    >
                        <i className="fas fa-expand-alt"></i>
                    </button>
                    <button
                        className="tree-action-button"
                        title="Collapse All"
                        onClick={() => setExpandedTopics({})}
                    >
                        <i className="fas fa-compress-alt"></i>
                    </button>
                </div>
            </div>

            <div className="topic-tree-search">
                <input
                    type="text"
                    className="topic-search-input"
                    placeholder="Search topics..."
                />
            </div>

            <div className="topic-tree-content">
                {Object.keys(topicTree).length === 0 ? (
                    <div className="empty-tree-message">
                        No topics available. Connect to a broker and publish a
                        message to see topics.
                    </div>
                ) : (
                    <ul className="topic-list">
                        {Object.entries(topicTree).map(([topicName, node]) =>
                            renderTopicNode(topicName, node)
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default TopicTree;
