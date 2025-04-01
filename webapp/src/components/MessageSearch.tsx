import React from "react";
import { Input } from "antd";

interface MessageSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="mb-4">
      <Input.Search
        placeholder="Search in message body..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
        allowClear
      />
    </div>
  );
};
