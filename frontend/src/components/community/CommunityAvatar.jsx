// frontend/src/components/community/CommunityAvatar.jsx
import React from 'react';
import './CommunityAvatar.css';

/**
 * Trích xuất 1-2 chữ cái viết tắt đại diện cho tên cộng đồng:
 * Ví dụ: "Journalism" -> "JO", "Data Science" -> "DS", "MIT" -> "MIT"
 */
export function getCommunityInitials(name) {
  if (!name || typeof name !== 'string') return 'CO';
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return clean.length >= 2 ? clean.slice(0, 2).toUpperCase() : clean.toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Hiển thị Avatar của Cộng đồng:
 * - Nếu có link ảnh avatar -> render thẻ <img>
 * - Nếu KHÔNG upload ảnh -> render chữ cái đầu trên NỀN ĐEN chữ trắng đậm (theo đúng yêu cầu dự án)
 */
export default function CommunityAvatar({
  avatarUrl,
  name,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  style = {}
}) {
  const initials = getCommunityInitials(name);

  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim()) {
    return (
      <div className={`comm-avatar comm-avatar--${size} comm-avatar--img ${className}`} style={style}>
        <img src={avatarUrl} alt={name || 'Community avatar'} />
      </div>
    );
  }

  // Mặc định: Nền đen chữ trắng đậm
  return (
    <div
      className={`comm-avatar comm-avatar--${size} comm-avatar--fallback-black ${className}`}
      style={style}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
}
