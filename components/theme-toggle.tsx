"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Đổi giao diện sáng/tối"
        className="icon-button"
        style={{ width: "38px", height: "38px" }}
        disabled
      >
        <Sun size={18} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chế độ sáng" : "Chế độ tối"}
      className="icon-button"
      style={{ width: "38px", height: "38px" }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
