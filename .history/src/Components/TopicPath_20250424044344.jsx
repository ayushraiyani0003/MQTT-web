// components/TopicPath.js
import React from "react";

function TopicPath({ topic }) {
    if (!topic) return <div>No topic selected</div>;

    const parts = topic.split("/");

    return (
        <div className="topic-tags">
            {parts.map((part, index) => {
                const path = parts.slice(0, index + 1).join("/");
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
