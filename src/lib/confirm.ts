import { App, Modal } from "antd";

type ConfirmActionOptions = {
  title: string;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk: () => void | Promise<void>;
};

type ModalApi = { confirm: (opts: Record<string, unknown>) => void };

let modalApi: ModalApi | null = null;

/**
 * Register the context-aware modal instance from <App> (antd). This lets
 * confirmAction consume the ConfigProvider theme and context, avoiding the
 * "Static function can not consume context" warning from Modal.confirm.
 */
export function registerModalApi(api: ModalApi) {
  modalApi = api;
}

// In-app replacement for native `confirm()`. Uses antd Modal.confirm with a
// danger-styled confirm button, centered. Never falls back to browser dialogs.
export function confirmAction({ title, content, okText, cancelText, onOk }: ConfirmActionOptions) {
  const options: Record<string, unknown> = {
    title,
    content,
    okText: okText ?? "Delete",
    cancelText: cancelText ?? "Cancel",
    okButtonProps: { danger: true },
    centered: true,
    onOk,
  };

  if (modalApi) {
    modalApi.confirm(options);
  } else {
    Modal.confirm(options);
  }
}
