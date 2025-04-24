// App.js - Main component
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import TopicTree from "./Components/TopicTree";
import ContentPanel from "./Components/ContentPanel";
import ConnectionModal from "./Components/ConnectionModal";

function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [topics, setTopics] = useState({});
    const [messages, setMessages] = useState({});
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [splitPosition, setSplitPosition] = useState(600);
    const splitDivRef = useRef(null);
    const isDraggingRef = useRef(false);

    // Load saved connection from localStorage
    useEffect(() => {
        const savedCredentials =
            JSON.parse(localStorage.getItem("mqttCredentials")) || null;
        // Auto-connect logic could go here if needed
    }, []);

    // Set up message cleanup timer (20 min retention)
    useEffect(() => {
        const RETENTION_TIME = 20 * 60 * 1000; // 20 minutes

        const cleanupInterval = setInterval(() => {
            const currentTime = Date.now();
            const cutoffTime = currentTime - RETENTION_TIME;

            setMessages((prevMessages) => {
                const newMessages = { ...prevMessages };
                let hasChanges = false;

                Object.keys(newMessages).forEach((topic) => {
                    const filteredMessages = newMessages[topic].filter(
                        (msg) => msg.timestamp > cutoffTime
                    );
                    if (filteredMessages.length !== newMessages[topic].length) {
                        hasChanges = true;
                        if (filteredMessages.length === 0) {
                            delete newMessages[topic];
                        } else {
                            newMessages[topic] = filteredMessages;
                        }
                    }
                });

                return hasChanges ? newMessages : prevMessages;
            });
        }, 60000); // Check every minute

        return () => clearInterval(cleanupInterval);
    }, []);

    // Handle resizable split view
    useEffect(() => {
        const handleMouseDown = (e) => {
            isDraggingRef.current = true;
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        };

        const handleMouseMove = (e) => {
            if (isDraggingRef.current) {
                const newPosition = e.clientX;
                if (
                    newPosition > 100 &&
                    newPosition < window.innerWidth - 200
                ) {
                    setSplitPosition(newPosition);
                }
            }
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        const splitDiv = splitDivRef.current;
        if (splitDiv) {
            splitDiv.addEventListener("mousedown", handleMouseDown);
        }

        return () => {
            if (splitDiv) {
                splitDiv.removeEventListener("mousedown", handleMouseDown);
            }
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    // Handle connection toggle
    const handleConnectionToggle = () => {
        if (isConnected) {
            disconnectMqtt();
        } else {
            setShowConnectionModal(true);
        }
    };

    // Connect to MQTT
    const connectMqtt = (credentials) => {
        // Mock connection - replace with actual MQTT client implementation
        console.log("Connecting with credentials:", credentials);

        // Save credentials to localStorage
        localStorage.setItem("mqttCredentials", JSON.stringify(credentials));

        // Simulate successful connection
        setTimeout(() => {
            setIsConnected(true);

            // Create some mock topics and messages for demonstration
            const mockTopics = {
                "ram_Bhechada-A": {
                    GENERAL_STATUS: "Run mode from MCU -- 24/4/2025,8:54:6",
                    CONTROL_STATUS: "Run mode of Master",
                    STATUS: "#M1,63,94 Min ,-48,-50,24/4/2025,8:54:34,100,1/0/0/0,63,33,00,56,60,11,90,WNW,0.00,459.24,-101,8.5",
                },
                "KP_Bharsam-8": {},
                "South_2107-B10_F": {},
                "ASHA_Talodara-B": {},
            };

            setTopics(mockTopics);

            // Subscribe to all topics
            subscribeToTopics(["#"]);
        }, 1000);
    };

    // Disconnect from MQTT
    const disconnectMqtt = () => {
        // Mock disconnection - replace with actual MQTT client disconnection
        setTimeout(() => {
            setIsConnected(false);
            setTopics({});
            setMessages({});
        }, 500);
    };

    // Subscribe to topics
    const subscribeToTopics = (topicFilters) => {
        console.log("Subscribing to topics:", topicFilters);
        // Would be implemented with actual MQTT client
    };

    // Publish a message
    const publishMessage = (topic, message, format) => {
        if (!isConnected) {
            alert("Please connect to a broker first");
            return;
        }

        // Validate format
        if (format === "json") {
            try {
                JSON.parse(message);
            } catch (e) {
                if (!window.confirm("Invalid JSON format. Send as raw?")) {
                    return;
                }
            }
        }

        console.log(`Publishing to ${topic}:`, message);

        // Add to messages state
        const timestamp = Date.now();
        setMessages((prev) => {
            const newMessages = { ...prev };
            if (!newMessages[topic]) {
                newMessages[topic] = [];
            }
            newMessages[topic] = [
                { content: message, format, timestamp },
                ...newMessages[topic],
            ];
            return newMessages;
        });

        // If this is a new topic, add it to the topics state
        setTopics((prev) => {
            if (!prev[topic]) {
                const parts = topic.split("/");
                const newTopics = { ...prev };
                let currentLevel = newTopics;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (!currentLevel[part]) {
                        currentLevel[part] = {};
                    }
                    currentLevel = currentLevel[part];
                }

                return newTopics;
            }
            return prev;
        });
    };

    // Handle topic selection
    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="header-left">
                    <button className="menu-toggle">
                        <i className="fas fa-bars"></i>
                    </button>
                    <h1>MQTT Explorer</h1>
                </div>

                <div className="header-search">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                    />
                    <button className="search-button">
                        <i className="fas fa-search"></i>
                    </button>
                </div>

                <div className="header-right">
                    <button
                        className={`connection-status ${
                            isConnected ? "connected" : "disconnected"
                        }`}
                        onClick={handleConnectionToggle}
                    >
                        <span
                            className={`status-indicator ${
                                isConnected ? "connected" : "disconnected"
                            }`}
                        ></span>
                        <span className="status-text">
                            {isConnected ? "DISCONNECT" : "CONNECT"}
                        </span>
                    </button>
                </div>
            </header>

            {/* Main Content with Resizable Split */}
            <div className="app-content">
                {/* Left Panel - Topic Tree */}
                <div
                    className="sidebar"
                    style={{ width: `${splitPosition}px` }}
                >
                    <TopicTree
                        topics={topics}
                        messages={messages}
                        onSelectTopic={handleTopicSelect}
                        selectedTopic={selectedTopic}
                    />
                </div>

                {/* Resizer */}
                <div
                    className="resizer"
                    ref={splitDivRef}
                    style={{ left: `${splitPosition}px` }}
                />

                {/* Right Panel - Content */}
                <div
                    className="main-content"
                    style={{ width: `calc(100% - ${splitPosition}px)` }}
                >
                    <ContentPanel
                        selectedTopic={selectedTopic}
                        messages={
                            selectedTopic ? messages[selectedTopic] || [] : []
                        }
                        onPublish={publishMessage}
                    />
                </div>
            </div>

            {/* Connection Modal */}
            {showConnectionModal && (
                <ConnectionModal
                    onConnect={connectMqtt}
                    onCancel={() => setShowConnectionModal(false)}
                />
            )}
        </div>
    );
}

export default App;
