// App.js - Main component with MQTT integration
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import TopicTree from "./Components/TopicTree";
import ContentPanel from "./Components/ContentPanel";
import ConnectionModal from "./Components/ConnectionModal";
import mqtt from "mqtt"; // Import the MQTT library

function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [topics, setTopics] = useState({});
    const [messages, setMessages] = useState({});
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [splitPosition, setSplitPosition] = useState(900); // Adjusted default width
    const [connectionError, setConnectionError] = useState(null);
    const splitDivRef = useRef(null);
    const isDraggingRef = useRef(false);
    const mqttClientRef = useRef(null);

    // Load saved connection from localStorage
    useEffect(() => {
        const savedCredentials =
            JSON.parse(localStorage.getItem("mqttCredentials")) || null;
        // Auto-connect if credentials exist and autoConnect is enabled
        if (savedCredentials && savedCredentials.autoConnect) {
            connectMqtt(savedCredentials);
        }
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

    // Clean up MQTT client on component unmount
    useEffect(() => {
        return () => {
            if (mqttClientRef.current && mqttClientRef.current.connected) {
                mqttClientRef.current.end();
            }
        };
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
    // Connect to MQTT broker
    const connectMqtt = (credentials) => {
        // Clear any previous error
        setConnectionError(null);

        try {
            // For browsers, we must use WebSockets
            const wsProtocol = credentials.useTLS ? "wss" : "ws";

            // Ensure port is a string and use appropriate WebSocket port
            const port =
                credentials.port || (credentials.useTLS ? "8084" : "8083");

            // Ensure path has a leading slash
            let path = credentials.path || "/mqtt";
            if (!path.startsWith("/")) {
                path = "/" + path;
            }

            // WebSocket URL format
            const url = `${wsProtocol}://${credentials.brokerUrl}:${port}${path}`;

            console.log(`Connecting to MQTT broker at ${url}`);

            // Set up connection options
            const options = {
                clientId: credentials.clientId,
                clean: true,
                connectTimeout: 30000,
                username: credentials.username || undefined,
                password: credentials.password || undefined,
                rejectUnauthorized: credentials.useTLS
                    ? !credentials.allowInsecure
                    : undefined,
                protocolVersion: 4,
            };

            // Create MQTT client with the WebSocket URL
            const client = mqtt.connect(url, options);
            mqttClientRef.current = client;

            // Set up event handlers
            client.on("connect", () => {
                console.log("Connected to MQTT broker");
                setIsConnected(true);
                setShowConnectionModal(false);

                // Save credentials if autoConnect is enabled
                if (credentials.autoConnect) {
                    localStorage.setItem(
                        "mqttCredentials",
                        JSON.stringify(credentials)
                    );
                } else {
                    localStorage.removeItem("mqttCredentials");
                }

                // Subscribe to # (all topics) by default
                subscribeToTopics(["#"]);
            });

            client.on("error", (err) => {
                console.error("MQTT connection error:", err);
                setConnectionError(`Connection error: ${err.message}`);
            });

            client.on("message", (topic, payload, packet) => {
                // console.log(
                //     `Received message on ${topic}:`,
                //     payload.toString()
                // );

                // Detect message format (try to parse as JSON)
                let format = "raw";
                try {
                    JSON.parse(payload.toString());
                    format = "json";
                } catch (e) {
                    // Not JSON, keep as raw
                }

                // Add message to state
                addMessage(topic, payload.toString(), format, Date.now());
            });

            client.on("disconnect", () => {
                console.log("Disconnected from MQTT broker");
                setIsConnected(false);
            });

            client.on("reconnect", () => {
                console.log("Attempting to reconnect to MQTT broker");
            });
        } catch (error) {
            console.error("Failed to connect to MQTT broker:", error);
            setConnectionError(`Failed to connect: ${error.message}`);
        }
    };

    // Add a message to the state
    const addMessage = (topic, content, format, timestamp) => {
        setMessages((prev) => {
            const newMessages = { ...prev };
            if (!newMessages[topic]) {
                newMessages[topic] = [];
            }
            newMessages[topic] = [
                { content, format, timestamp },
                ...newMessages[topic],
            ].slice(0, 100); // Keep only last 100 messages per topic for performance
            return newMessages;
        });

        // Update topics structure
        updateTopicStructure(topic);
    };

    // Update the topic structure when new messages arrive
    const updateTopicStructure = (topicPath) => {
        setTopics((prev) => {
            if (!prev[topicPath]) {
                const parts = topicPath.split("/");
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

    // Disconnect from MQTT broker
    const disconnectMqtt = () => {
        if (mqttClientRef.current) {
            console.log("Disconnecting from MQTT broker");
            mqttClientRef.current.end(true, {}, () => {
                console.log("Disconnected from MQTT broker");
                setIsConnected(false);
            });
        }
    };

    // Subscribe to specific topics
    const subscribeToTopics = (topicFilters) => {
        if (!mqttClientRef.current || !mqttClientRef.current.connected) {
            console.error("Cannot subscribe: MQTT client not connected");
            return;
        }

        topicFilters.forEach((topic) => {
            mqttClientRef.current.subscribe(topic, (err) => {
                if (err) {
                    console.error(`Error subscribing to ${topic}:`, err);
                } else {
                    console.log(`Subscribed to ${topic}`);
                }
            });
        });
    };

    // Publish a message
    const publishMessage = (topic, message, format, options = {}) => {
        if (!mqttClientRef.current || !mqttClientRef.current.connected) {
            alert("Please connect to a broker first");
            return;
        }

        // Default publish options
        const publishOptions = {
            qos: options.qos || 0,
            retain: options.retain || false,
        };

        // Format the message if needed
        let formattedMessage = message;
        if (format === "json") {
            try {
                // If it's a string that should be JSON, try to parse it to validate
                // and then stringify it again to ensure proper formatting
                const jsonObj = JSON.parse(message);
                formattedMessage = JSON.stringify(jsonObj);
            } catch (e) {
                if (!window.confirm("Invalid JSON format. Send as raw?")) {
                    return;
                }
                // If user confirms, send as raw text
                format = "raw";
            }
        }

        console.log(
            `Publishing to ${topic} (${format}):`,
            formattedMessage,
            publishOptions
        );

        // Publish the message
        mqttClientRef.current.publish(
            topic,
            formattedMessage,
            publishOptions,
            (err) => {
                if (err) {
                    console.error("Error publishing message:", err);
                    alert(`Failed to publish message: ${err.message}`);
                } else {
                    console.log("Message published successfully");

                    // Add the message to our local store
                    const timestamp = Date.now();
                    addMessage(topic, formattedMessage, format, timestamp);
                }
            }
        );
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
                    <button className="search-button"></button>
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

            {/* Connection Error Alert */}
            {connectionError && (
                <div className="connection-error">
                    <span className="error-message">{connectionError}</span>
                    <button
                        className="error-close"
                        onClick={() => setConnectionError(null)}
                    >
                        ×
                    </button>
                </div>
            )}

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
