"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { App, ConfigProvider, theme } from "antd";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ui/ToastContainer";
import { useToast } from "@/contexts/ToastContext";
import { registerModalApi } from "@/lib/confirm";

function ToastContainerWrapper() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

// Bridges the context-aware antd modal instance into confirmAction so static
// helpers consume the ConfigProvider theme instead of the deprecated path.
function AntdAppBridge() {
  const { modal } = App.useApp();
  useEffect(() => {
    registerModalApi(modal);
  }, [modal]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#f0f2f5",
          colorInfo: "#f0f2f5",
          colorSuccess: "#22c55e",
          colorWarning: "#eab308",
          colorError: "#ef4444",
          colorBgBase: "#08090a",
          colorTextBase: "#ffffff",
          colorBgContainer: "#101216",
          colorBgElevated: "#181b20",
          colorText: "#f0f2f5",
          colorTextSecondary: "#8b929e",
          colorBorder: "rgba(255, 255, 255, 0.08)",
          colorBorderSecondary: "rgba(255, 255, 255, 0.08)",
          borderRadius: 8,
          fontFamily:
            "var(--font-inter), Inter, system-ui, -apple-system, sans-serif",
        },
        components: {
          Button: { primaryShadow: "none", defaultShadow: "none" },
          Input: {
            colorTextPlaceholder: "#8b929e",
            activeBg: "#181b20",
            activeShadow: "none",
            hoverBg: "#181b20",
            colorBgContainer: "#181b20",
          },
          Select: {
            selectorBg: "#181b20",
            optionActiveBg: "#22262e",
            optionSelectedBg: "rgba(255, 255, 255, 0.08)",
            optionSelectedColor: "#ffffff",
          },
        },
      }}
    >
      <App>
        <SessionProvider>
          <ToastProvider>
            {children}
            <ToastContainerWrapper />
            <AntdAppBridge />
          </ToastProvider>
        </SessionProvider>
      </App>
    </ConfigProvider>
  );
}
