import { notification } from "antd";

export const useNotify = () => {
  const success = (title: string, description?: string) => {
    notification.success({
      title,
      description,
    });
  };
  const error = (title: string, description?: string) => {
    notification.error({
      title,
      description,
    });
  };
  const warning = (title: string, description?: string) => {
    notification.warning({
      title,
      description,
    });
  };

  const info = (title: string, description?: string) => {
    notification.info({
      title,
      description,
    });
  };

  return {
    success,
    error,
    warning,
    info,
  };
};
