// components/ConnectionModal.js
import React, { useState, useEffect } from "react";

function ConnectionModal({ onConnect, onCancel }) {
    const [credentials, setCredentials] = useState({
        brokerUrl: "",
        port: 8080,
        clientId:
            "mqtt-explorer-web-" + Math.random().toString(16).substring(2, 8),
        username: "",
        password: "",
        useTLS: false,
        autoConnect: false,
    });

    // Load saved credentials on mount
    useEffect(() => {
        const savedCredentials = JSON.parse(
            localStorage.getItem("mqttCredentials")
        );
        if (savedCredentials) {
            setCredentials(savedCredentials);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                    ? Number(value)
                    : value,
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
                                placeholder="broker.example.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="port">Port</label>
                            <input
                                type="number"
                                id="port"
                                name="port"
                                value={credentials.port}
                                onChange={handleChange}
                                required
                            />
                            <div className="input-help">
                                Use 8080 for WebSocket, 8883 for WebSocket
                                Secure
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
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="useTLS"
                                    checked={credentials.useTLS}
                                    onChange={handleChange}
                                />
                                Use TLS/SSL
                            </label>
                        </div>
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
