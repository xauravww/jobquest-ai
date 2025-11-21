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
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <SessionProvider>
        <ToastProvider>
          {children}
          <ToastContainerWrapper />
        </ToastProvider>
      </SessionProvider>
    </ConfigProvider>
  );
}
