import React from "react";
import { ConfigProvider } from "antd";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Tree: {
            indentSize: 12,
            titleHeight: 24,
            paddingXS: 8,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};
