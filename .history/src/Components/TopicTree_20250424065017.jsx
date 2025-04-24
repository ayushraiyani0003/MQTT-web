// components/TopicTree.js
import React, { useState, useEffect, useRef } from "react";
import "./TopicTree.css";

function TopicTree({
    topics,
    messages,
    onSelectTopic,
    selectedTopic,
    searchTerm = "",
}) {
    const [expandedTopics, setExpandedTopics] = useState({});
    const [recentlyUpdated, setRecentlyUpdated] = useState({});
    const previousMessagesRef = useRef({});

    // Auto-expand root topics on first load
    useEffect(() => {
        if (
            Object.keys(topics).length > 0 &&
            Object.keys(expandedTopics).length === 0
        ) {
            // Get root level topics
            const rootTopics = {};
            Object.keys(topics).forEach((topicPath) => {
                const firstPart = topicPath.split("/")[0];
                rootTopics[firstPart] = true;
            });

            // Auto-expand root level topics
            setExpandedTopics(rootTopics);
        }
    }, [topics]);

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

                // Highlight all parent topics in the hierarchy
                highlightFullTopicPath(topic, newRecentlyUpdated);

                // Auto-expand parent topics when new messages arrive
                expandParentTopics(topic);
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

    // Add this function to highlight the entire topic path
    const highlightFullTopicPath = (topic, updatedTopics) => {
        // Split the topic into parts (e.g., "jsm-pub/1937_Dunavada-mark-B/status")
        const parts = topic.split("/");

        // Track ancestor paths
        let currentPath = "";

        // Highlight each level of the hierarchy
        for (let i = 0; i < parts.length; i++) {
            // Build the path progressively
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

            // Add to recently updated with different timestamps to create slight visual cascade
            const updateTime = Date.now() - i * 50;
            updatedTopics[currentPath] = updateTime;
        }
    };

    // Add effect to auto-expand topics that match the search term
    useEffect(() => {
        if (searchTerm) {
            // Expand all topics that match the search term
            Object.keys(topics).forEach((topicPath) => {
                if (
                    topicPath.toLowerCase().includes(searchTerm.toLowerCase())
                ) {
                    expandParentTopics(topicPath);
                }
            });
        }
    }, [searchTerm, topics]);

    // Helper function to expand all parent topics of a given topic
    const expandParentTopics = (topic) => {
        const parts = topic.split("/");
        let currentPath = "";

        // Expand each level of the path
        for (let i = 0; i < parts.length; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            setExpandedTopics((prev) => ({
                ...prev,
                [currentPath]: true,
            }));
        }
    };

    const toggleTopic = (topic, event) => {
        // Stop propagation to prevent the click from also selecting the topic
        if (event) {
            event.stopPropagation();
        }

        console.log(`Toggling topic: ${topic}`);
        setExpandedTopics((prev) => ({
            ...prev,
            [topic]: !prev[topic],
        }));
    };

    // Function to build a tree structure from flat topics
    const buildTopicTree = () => {
        const tree = {};

        // Create a helper function to insert a topic path into the tree
        const insertTopic = (topicPath) => {
            const parts = topicPath.split("/");
            let currentNode = tree;
            let currentPath = "";

            // Build each level of the tree
            parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!currentNode[part]) {
                    currentNode[part] = {
                        children: {},
                        lastMessage: null,
                        path: currentPath,
                        messageCount: 0,
                        totalTopics: 0,
                        isLeaf: index === parts.length - 1,
                    };
                }

                // Update node properties if this is the full path
                if (index === parts.length - 1) {
                    currentNode[part].fullPath = topicPath;
                }

                currentNode = currentNode[part].children;
            });
        };

        // First pass: create the tree structure
        Object.keys(topics).forEach(insertTopic);

        // Second pass: add message data
        Object.keys(messages).forEach((topicPath) => {
            if (messages[topicPath] && messages[topicPath].length > 0) {
                // Make sure this topic path exists in the tree
                insertTopic(topicPath);

                const parts = topicPath.split("/");
                let currentNode = tree;
                let currentPath = "";

                // Find the leaf node for this topic path
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;

                    if (i === parts.length - 1) {
                        // Update the leaf node with message data
                        currentNode[part].lastMessage = messages[topicPath][0]; // Most recent message
                        currentNode[part].messageCount =
                            messages[topicPath].length;
                    }

                    // Update message counts for parent nodes
                    currentNode[part].messageCount =
                        (currentNode[part].messageCount || 0) +
                        (i === parts.length - 1
                            ? messages[topicPath].length
                            : 0);

                    if (i < parts.length - 1) {
                        currentNode[part].totalTopics =
                            (currentNode[part].totalTopics || 0) + 1;
                        currentNode = currentNode[part].children;
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
        const isLeaf = !hasChildren;

        // Determine the hierarchical level for this topic
        const hierarchyLevel = displayPath.split("/").length - 1;

        // Determine if this is an ancestor of a recently updated topic
        const isAncestorOfUpdated =
            !isRecentlyUpdated &&
            Object.keys(recentlyUpdated).some((updatedTopic) => {
                return updatedTopic.startsWith(displayPath + "/");
            });

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
            isAncestorOfUpdated ? "ancestor-updated" : "",
            isLeaf ? "leaf" : "branch",
            `level-${hierarchyLevel}`, // Add level class for different highlight styles
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <li
                key={displayPath}
                className={nodeClasses}
                onClick={(e) => toggleTopic(displayPath, e)}
                data-timestamp={
                    isRecentlyUpdated ? recentlyUpdated[displayPath] : undefined
                }
            >
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
                        <span className="toggle-icon-placeholder">•</span>
                    )}
                    <span className="topic-name">{name}</span>
                    {(hasMessage || hasChildren) && (
                        <span className="topic-info">
                            {node.messageCount > 0
                                ? `(${
                                      hasChildren
                                          ? (node.totalTopics || 0) +
                                            " topics, "
                                          : ""
                                  }${node.messageCount} msg${
                                      node.messageCount > 1 ? "s" : ""
                                  })`
                                : ""}
                        </span>
                    )}
                    {isRecentlyUpdated && (
                        <span
                            className="update-indicator"
                            title={`Updated: ${new Date(
                                recentlyUpdated[displayPath]
                            ).toLocaleTimeString()}`}
                        ></span>
                    )}

                    {/* Show "NEW" badge for very recently updated topics */}
                    {isRecentlyUpdated &&
                        Date.now() - recentlyUpdated[displayPath] < 5000 && (
                            <span className="new-message-count">NEW</span>
                        )}
                </div>

                {/* Show message content if this is a selected topic with messages */}
                {isSelected && hasMessage && (
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

                {hasChildren && (
                    <ul
                        className={`subtopic-list ${
                            isExpanded ? "visible" : "hidden"
                        }`}
                    >
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

    // Helper function to debug expanded topics
    const debugExpandedTopics = () => {
        console.log("Currently expanded topics:", expandedTopics);
        console.log("Available topics:", topics);
    };

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
