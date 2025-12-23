import React, { useEffect, useRef, useState } from "react";

const TruncatedHtml = ({
  html,
  lines = 4,
  ellipsisText = "... Xem thêm",
  ellipsisClass = "text-blue-600 cursor-pointer",
  className = "",
}) => {
  const contentRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseFloat(
        getComputedStyle(contentRef.current).lineHeight
      );
      const maxHeight = lineHeight * lines;
      setIsTruncated(contentRef.current.scrollHeight > maxHeight + 1);
    }
  }, [html, lines]);

  return (
    <div className={`relative ${className}`}>
      {/* Nội dung HTML */}
      <div
        ref={contentRef}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Chỉ hiện khi bị truncate */}
      {isTruncated && (
        <span
          className={`absolute bottom-0 right-0 pl-1 bg-white ${ellipsisClass}`}
        >
          {ellipsisText}
        </span>
      )}
    </div>
  );
};

export default TruncatedHtml;
