// components/TopicTree.js
import React, { useState } from 'react';

function TopicTree({ topics, messages, onSelectTopic, selectedTopic }) {
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  const renderTopicNode = (name, node, path = '') => {
    const fullPath = path ? `${path}/${name}` : name;
    const isExpanded = expandedTopics[fullPath];
    const hasChildren = Object.keys(node).length > 0;
    const hasMessages = messages[fullPath] && messages[fullPath].length > 0;
    const isSelected = selectedTopic === fullPath;
    
    return (
      <li 
        key={fullPath}
        className={`topic-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
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
            {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
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

// components/ContentPanel.js
import React, { useState } from 'react';
import TopicPath from './TopicPath';
import MessageHistory from './MessageHistory';
import PublishForm from './PublishForm';

function ContentPanel({ selectedTopic, messages, onPublish }) {
  const [sections, setSections] = useState({
    topic: true,
    value: true,
    publish: true,
    stats: true
  });

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="content-panels">
      {/* Topic Section */}
      <div className="content-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('topic')}
        >
          <div className="section-title">Topic</div>
          <div className="section-controls">
            <i className={`fas fa-chevron-${sections.topic ? 'up' : 'down'}`}></i>
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
          onClick={() => toggleSection('value')}
        >
          <div className="section-title">Value</div>
          <div className="section-controls">
            <i className={`fas fa-chevron-${sections.value ? 'up' : 'down'}`}></i>
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
          onClick={() => toggleSection('publish')}
        >
          <div className="section-title">Publish</div>
          <div className="section-controls">
            <i className={`fas fa-chevron-${sections.publish ? 'up' : 'down'}`}></i>
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
          onClick={() => toggleSection('stats')}
        >
          <div className="section-title">Stats</div>
          <div className="section-controls">
            <i className={`fas fa-chevron-${sections.stats ? 'up' : 'down'}`}></i>
          </div>
        </div>
        {sections.stats && (
          <div className="section-body">
            <div className="stats-info">
              <div className="stat-row">
                <span className="stat-label">Messages:</span>
                <span className="stat-value">#{selectedTopic && messages.length || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Subtopics:</span>
                <span className="stat-value">
                  {selectedTopic ? countSubtopics(selectedTopic) : 0}
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

// components/TopicPath.js
import React from 'react';

function TopicPath({ topic }) {
  if (!topic) return <div>No topic selected</div>;

  const parts = topic.split('/');
  
  return (
    <div className="topic-tags">
      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join('/');
        return (
          <div key={path} className="tag" data-path={path}>
            {part}
          </div>
        );
      })}
    </div>
  );
}

export default TopicPath;

// components/MessageHistory.js
import React from 'react';

function MessageHistory({ messages }) {
  if (!messages || messages.length === 0) {
    return <div className="empty-history">No messages available</div>;
  }

  return (
    <div className="message-history-container">
      <div className="section-tab">
        <span className="tab-icon">▶</span>
        <span className="tab-title">History</span>
      </div>
      <div className="message-history">
        {messages.map((msg, index) => (
          <div key={index} className="message-item">
            <div className="message-header">
              {new Date(msg.timestamp).toLocaleString()}
            </div>
            <div className="message-content">
              <pre>{formatMessage(msg.content, msg.format)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to format message based on its type
function formatMessage(content, format) {
  if (format === 'json') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch (e) {
      return content;
    }
  }
  return content;
}

export default MessageHistory;

// components/PublishForm.js
import React, { useState, useEffect } from 'react';

function PublishForm({ initialTopic, onPublish }) {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [format, setFormat] = useState('json');
  
  // Update topic when initialTopic prop changes
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }
    
    onPublish(topic, message, format);
    
    // Don't clear the topic after publishing
    setMessage('');
    
    // Save recent topics to localStorage
    saveRecentTopic(topic);
  };
  
  const saveRecentTopic = (topic) => {
    const recentTopics = JSON.parse(localStorage.getItem('recentTopics')) || [];
    const updatedTopics = [
      topic,
      ...recentTopics.filter(t => t !== topic)
    ].slice(0, 10);
    
    localStorage.setItem('recentTopics', JSON.stringify(updatedTopics));
  };
  
  return (
    <form className="publish-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Topic</label>
        <div className="topic-input-container">
          <input
            type="text"
            className="topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic"
          />
          <button
            type="button"
            className="clear-button"
            onClick={() => setTopic('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div className="form-row message-type-selector">
        <div className="message-types">
          <label className="message-type">
            <input
              type="radio"
              name="messageType"
              value="raw"
              checked={format === 'raw'}
              onChange={() => setFormat('raw')}
            />
            <span>raw</span>
          </label>
          <label className="message-type">
            <input
              type="radio"
              name="messageType"
              value="xml"
              checked={format === 'xml'}
              onChange={() => setFormat('xml')}
            />
            <span>xml</span>
          </label>
          <label className="message-type">
            <input
              type="radio"
              name="messageType"
              value="json"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
            />
            <span>json</span>
          </label>
        </div>
        <div className="format-button">
          <i className="fas fa-align-left"></i>
        </div>
      </div>
      
      <div className="form-row">
        <textarea
          className="message-content"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to publish"
        />
      </div>
      
      <div className="form-row publish-controls">
        <button type="submit" className="publish-button">
          <i className="fas fa-paper-plane"></i>
          PUBLISH
        </button>
      </div>
    </form>
  );
}

export default PublishForm;

