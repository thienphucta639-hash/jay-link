// Vietnamese relative time formatting

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 10) return "vừa xong";
  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return "hôm qua";
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffWeek === 1) return "tuần trước";
  if (diffWeek < 4) return `${diffWeek} tuần trước`;
  if (diffMonth === 1) return "tháng trước";
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${Math.floor(diffMonth / 12)} năm trước`;
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("vi-VN", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: false 
  });

  if (isToday) return `Hôm nay lúc ${time}`;
  if (isYesterday) return `Hôm qua lúc ${time}`;

  const dateStr = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${dateStr} lúc ${time}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "sáng";
  if (hour < 18) return "chiều";
  return "tối";
}
