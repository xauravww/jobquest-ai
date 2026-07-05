"use client";

import { SessionProvider } from "next-auth/react";
import { ConfigProvider, theme } from "antd";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ui/ToastContainer";
import { useToast } from "@/contexts/ToastContext";

function ToastContainerWrapper() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#ff6b4a",
          colorInfo: "#ff6b4a",
          colorSuccess: "#3fb950",
          colorWarning: "#d9a441",
          colorError: "#e5534b",
          colorBgBase: "#0e1116",
          colorTextBase: "#ffffff",
          colorBgContainer: "#161b22",
          colorBgElevated: "#1c2230",
          colorText: "#e6e9ef",
          colorTextSecondary: "#8a93a6",
          colorBorder: "#232a36",
          colorBorderSecondary: "#232a36",
          borderRadius: 8,
          fontFamily:
            "var(--font-inter), Inter, system-ui, -apple-system, sans-serif",
        },
        components: {
          Button: { primaryShadow: "none", defaultShadow: "none" },
          Input: {
            colorTextPlaceholder: "#5c6575",
            activeBg: "#1c2230",
            hoverBg: "#1c2230",
            colorBgContainer: "#1c2230",
          },
        },
      }}
    >
      <SessionProvider>
        <ToastProvider>
          {children}
          <ToastContainerWrapper />
        </ToastProvider>
      </SessionProvider>
    </ConfigProvider>
  );
}
