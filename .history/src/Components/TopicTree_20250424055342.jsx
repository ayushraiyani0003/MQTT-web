// components/TopicTree.js
import React, { useState, useEffect, useRef } from "react";
import "./TopicTree.css";

function TopicTree({ topics, messages, onSelectTopic, selectedTopic }) {
    const [expandedTopics, setExpandedTopics] = useState({});
    const [recentlyUpdated, setRecentlyUpdated] = useState({});
    const previousMessagesRef = useRef({});
    const [searchTerm, setSearchTerm] = useState("");

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

    const toggleTopic = (topic, event) => {
        // Prevent the click from also selecting the topic
        event.stopPropagation();

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
            let currentPath = "";

            parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!currentNode[part]) {
                    currentNode[part] = {
                        children: {},
                        lastMessage: null,
                        path: currentPath,
                        messageCount: 0,
                        totalTopics: 0,
                    };
                }

                // If this is the last part, mark it as a leaf
                if (index === parts.length - 1) {
                    currentNode[part].isLeaf = true;
                    currentNode[part].fullPath = topicPath;
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

                // Track parent nodes to update their stats
                const parentNodes = [];

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;

                    if (currentNode[part]) {
                        parentNodes.push(currentNode[part]);

                        if (i === parts.length - 1) {
                            // We're at the leaf node for this topic
                            currentNode[part].lastMessage =
                                messages[topicPath][0]; // Most recent message
                            currentNode[part].messages = messages[topicPath]; // All messages
                            currentNode[part].messageCount =
                                messages[topicPath].length;
                            currentNode[part].fullPath = topicPath;

                            // Update message counts for parent nodes
                            parentNodes.forEach((parentNode) => {
                                if (parentNode !== currentNode[part]) {
                                    parentNode.messageCount +=
                                        messages[topicPath].length;
                                    parentNode.totalTopics =
                                        (parentNode.totalTopics || 0) + 1;
                                }
                            });
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

    const renderTopicNode = (name, node, path = "", level = 0) => {
        const currentPath = path ? `${path}/${name}` : name;
        const displayPath = node.fullPath || currentPath;
        const isExpanded = expandedTopics[displayPath];
        const hasChildren = Object.keys(node.children || {}).length > 0;
        const hasMessage = node.lastMessage !== null;
        const isSelected = selectedTopic === displayPath;
        const isRecentlyUpdated = recentlyUpdated[displayPath];
        const isLeaf = node.isLeaf;

        // Skip if not matching search
        if (
            searchTerm &&
            !displayPath.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
            // Still render if it has children that might match
            if (
                !hasChildren ||
                !Object.entries(node.children).some(
                    ([childName, childNode]) => {
                        const childPath = currentPath
                            ? `${currentPath}/${childName}`
                            : childName;
                        return childPath
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                    }
                )
            ) {
                return null;
            }
        }

        // Classes for visual styling
        const nodeClasses = [
            "topic-item",
            isExpanded ? "expanded" : "",
            isSelected ? "selected" : "",
            isRecentlyUpdated ? "recently-updated" : "",
            isLeaf ? "leaf" : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <li key={displayPath} className={nodeClasses}>
                <div
                    className="topic-header"
                    onClick={() => onSelectTopic(displayPath)}
                >
                    {hasChildren ? (
                        <span
                            className="toggle-icon"
                            onClick={(e) => toggleTopic(displayPath, e)}
                        >
                            {isExpanded ? "▼" : "▶"}
                        </span>
                    ) : (
                        <span className="toggle-icon empty">•</span>
                    )}
                    <span className="topic-name">{name}</span>
                    {(hasMessage || hasChildren) && (
                        <span className="topic-info">
                            {node.messageCount
                                ? `(${
                                      hasChildren ? node.totalTopics || 0 : ""
                                  } topic${node.totalTopics > 1 ? "s" : ""}, ${
                                      node.messageCount
                                  } message${node.messageCount > 1 ? "s" : ""})`
                                : ""}
                        </span>
                    )}
                    {isRecentlyUpdated && (
                        <span
                            className="update-indicator"
                            title="Recently updated"
                        ></span>
                    )}
                </div>

                {/* Show message content if this is an expanded leaf node AND it's selected */}
                {isLeaf && hasMessage && isSelected && (
                    <div className="topic-content">
                        <div className="topic-data">
                            {typeof node.lastMessage.content === "string"
                                ? node.lastMessage.content
                                      .split("\n")
                                      .map((line, i) => (
                                          <div key={i}>{line}</div>
                                      ))
                                : JSON.stringify(
                                      node.lastMessage.content,
                                      null,
                                      2
                                  )}
                        </div>
                    </div>
                )}

                {hasChildren && isExpanded && (
                    <ul className="subtopic-list">
                        {Object.entries(node.children)
                            .sort(([aName], [bName]) =>
                                aName.localeCompare(bName)
                            )
                            .map(([childName, childNode]) =>
                                renderTopicNode(
                                    childName,
                                    childNode,
                                    currentPath,
                                    level + 1
                                )
                            )
                            .filter(Boolean)}
                    </ul>
                )}
            </li>
        );
    };

    const topicTree = buildTopicTree();

    return (
        <div className="topic-tree">
            <div className="topic-tree-content">
                {Object.keys(topicTree).length === 0 ? (
                    <div className="empty-tree-message">
                        No topics available. Connect to a broker and publish a
                        message to see topics.
                    </div>
                ) : (
                    <ul className="topic-list">
                        {Object.entries(topicTree)
                            .sort(([aName], [bName]) =>
                                aName.localeCompare(bName)
                            )
                            .map(([topicName, node]) =>
                                renderTopicNode(topicName, node)
                            )
                            .filter(Boolean)}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default TopicTree;
