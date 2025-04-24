// components/ConnectionModal.js
import React, { useState, useEffect } from "react";
import "./ConnectionModal.css";

function ConnectionModal({ onConnect, onCancel }) {
    const [credentials, setCredentials] = useState({
        brokerUrl: "",
        port: "8080", // Default to WebSocket port as a string
        clientId:
            "mqtt-explorer-web-" + Math.random().toString(16).substring(2, 8),
        username: "",
        password: "",
        path: "/mqtt", // WebSocket path
        useTLS: false,
        allowInsecure: false, // Allow insecure TLS connections (self-signed certs)
        autoConnect: false,
    });

    // Load saved credentials on mount
    useEffect(() => {
        const savedCredentials = JSON.parse(
            localStorage.getItem("mqttCredentials")
        );
        if (savedCredentials) {
            // Ensure port is a string to avoid controlled/uncontrolled input issues
            savedCredentials.port = savedCredentials.port
                ? String(savedCredentials.port)
                : "8083";
            setCredentials(savedCredentials);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConnect(credentials);
    };

    return (
        <div className="modal visible">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Connection Settings</h2>
                    <button className="close-button" onClick={onCancel}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <form className="connection-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="brokerUrl">Broker URL</label>
                            <input
                                type="text"
                                id="brokerUrl"
                                name="brokerUrl"
                                value={credentials.brokerUrl}
                                onChange={handleChange}
                                placeholder="mqtt.sunchaser.cloud"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="port">WebSocket Port</label>
                            <input
                                type="text"
                                id="port"
                                name="port"
                                value={credentials.port}
                                onChange={handleChange}
                                required
                            />
                            <div className="input-help">
                                WebSocket ports: 8080 (WS).
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="path">WebSocket Path</label>
                            <input
                                type="text"
                                id="path"
                                name="path"
                                value={credentials.path}
                                onChange={handleChange}
                                placeholder="/mqtt"
                            />
                            <div className="input-help">
                                Usually "/mqtt" for most brokers
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="clientId">Client ID</label>
                            <input
                                type="text"
                                id="clientId"
                                name="clientId"
                                value={credentials.clientId}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                            />
                        </div>
                        {/* <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="useTLS"
                                    checked={credentials.useTLS}
                                    onChange={handleChange}
                                />
                                Use Secure WebSockets (WSS)
                            </label>
                        </div> */}
                        {/* {credentials.useTLS && (
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="allowInsecure"
                                        checked={credentials.allowInsecure}
                                        onChange={handleChange}
                                    />
                                    Allow Insecure Connections (self-signed
                                    certs)
                                </label>
                            </div>
                        )}
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="autoConnect"
                                    checked={credentials.autoConnect}
                                    onChange={handleChange}
                                />
                                Connect automatically next time
                            </label>
                        </div> */}
                        <div className="connection-status-message">
                            Connecting to:{" "}
                            {credentials.useTLS ? "wss://" : "ws://"}
                            {credentials.brokerUrl}:{credentials.port}
                            {credentials.path}
                        </div>
                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="connect-button">
                                Connect
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ConnectionModal;
