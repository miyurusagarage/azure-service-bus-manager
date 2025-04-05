import React from "react";
import { Layout } from "antd";
import { QueueViewer } from "../components/QueueViewer";
import { ResizableSider } from "../components/ResizableSider";
import { Header } from "../components/Header";
import { ConnectionPrompt } from "../components/ConnectionPrompt";
import { MessageDetailsModal } from "../components/MessageDetailsModal";
import { useServiceBusStore } from "../stores/serviceBusStore";

const { Content } = Layout;

export const MainPage: React.FC = () => {
  const { isConnected, selectedMessage, setSelectedMessage, selectedNode } = useServiceBusStore();

  if (!isConnected) {
    return <ConnectionPrompt />;
  }

  return (
    <Layout className="h-screen overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <ResizableSider />
        <Content className="bg-gray-50 p-6 overflow-auto flex-1">
          <QueueViewer selectedNode={selectedNode} />
        </Content>
      </div>
      <MessageDetailsModal
        visible={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
      />
    </Layout>
  );
};
