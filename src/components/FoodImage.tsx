"use client";
import React, { useState } from "react";

export default function FoodImage({ 
  src, 
  alt, 
  fallbackEmoji = "🍛", 
  className = "food-img",
  style
}: { 
  src?: string | null; 
  alt: string; 
  fallbackEmoji?: string; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`tile ${className.includes("sm") ? "sm" : ""}`} style={style} aria-label={alt}>
        <span>{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style}
      onError={() => setError(true)} 
      loading="lazy"
    />
  );
}
