// components/ConnectionModal.js
import React, { useState, useEffect } from "react";

function ConnectionModal({ onConnect, onCancel }) {
    const [credentials, setCredentials] = useState({
        brokerUrl: "",
        port: 1883,
        clientId:
            "mqtt-explorer-web-" + Math.random().toString(16).substring(2, 8),
        username: "",
        password: "",
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
        const { name, value } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [name]: name === "port" ? Number(value) : value,
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
                                placeholder="mqtt://broker.example.com"
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
                        </div>
                        <div className="form-group">
                            <label htmlFor="clientId">Client ID</label>
                            <input
                                type="text"
                                id="clientId"
                                name="clientId"
                                value={credentials.clientId}
                                onChange={handleChange}
                                placeholder="mqtt-explorer-web"
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
