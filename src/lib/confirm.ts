import { Modal } from "antd";

type ConfirmActionOptions = {
  title: string;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk: () => void | Promise<void>;
};

// In-app replacement for native `confirm()`. Uses antd Modal.confirm with a
// danger-styled confirm button, centered. Never falls back to browser dialogs.
export function confirmAction({ title, content, okText, cancelText, onOk }: ConfirmActionOptions) {
  Modal.confirm({
    title,
    content,
    okText: okText ?? "Delete",
    cancelText: cancelText ?? "Cancel",
    okButtonProps: { danger: true },
    centered: true,
    onOk,
  });
}
