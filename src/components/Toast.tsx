import { useEffect, useState } from "react";

interface ToastProps {
  msg: string | null;
  type: string;
}

export function Toast({ msg, type }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (msg) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  if (!visible || !msg) return null;

  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: type === "success" ? "#059669" : "#DC2626",
      color: "#fff", padding: "12px 24px", borderRadius: 12,
      fontWeight: 700, fontSize: 14, zIndex: 9999,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      fontFamily: "'Poppins', sans-serif",
    }}>
      {type === "success" ? "✅" : "❌"} {msg}
    </div>
  );
}