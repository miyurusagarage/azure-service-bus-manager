import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MessageTable } from "../components/MessageTable";
import type { ServiceBusMessage } from "../types/serviceBus";

const mockMessages: ServiceBusMessage[] = [
  {
    sequenceNumber: BigInt(1),
    messageId: "msg-1",
    contentType: "application/json",
    enqueuedTime: new Date("2024-03-20T12:00:00"),
    body: "test-body-1",
  },
  {
    sequenceNumber: BigInt(2),
    messageId: "msg-2",
    contentType: "application/json",
    enqueuedTime: new Date("2024-03-20T13:00:00"),
    body: "test-body-2",
  },
];

const mockProps = {
  messages: mockMessages,
  onViewMessage: vi.fn(),
  onDeleteMessage: vi.fn(),
  deletingMessage: {},
  queueName: "test-queue",
  pagination: {
    current: 1,
    pageSize: 10,
    total: 20,
  },
  onPaginationChange: vi.fn(),
};

describe("MessageTable", () => {
  it("renders column headers correctly", () => {
    render(<MessageTable {...mockProps} />);
    expect(screen.getByText("Seq No.")).toBeInTheDocument();
    expect(screen.getByText("Message ID")).toBeInTheDocument();
    expect(screen.getByText("Content Type")).toBeInTheDocument();
    expect(screen.getByText("Enqueued Time")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("displays message data correctly", () => {
    render(<MessageTable {...mockProps} />);
    const cells = screen.getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("1");
    expect(screen.getByText("msg-1")).toBeInTheDocument();
    const contentTypeCells = screen.getAllByRole("cell");
    expect(contentTypeCells[2]).toHaveTextContent("json");
    expect(screen.getByText("3/20/2024, 12:00:00 PM")).toBeInTheDocument();
  });

  it("handles view message button click", () => {
    render(<MessageTable {...mockProps} />);
    const viewButtons = screen.getAllByText("View Body");
    fireEvent.click(viewButtons[0]);
    expect(mockProps.onViewMessage).toHaveBeenCalledWith(mockMessages[0]);
  });

  it("handles delete message button click", () => {
    render(<MessageTable {...mockProps} />);
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);
    expect(mockProps.onDeleteMessage).toHaveBeenCalledWith(mockMessages[0], "test-queue");
  });

  it("shows loading state", () => {
    render(<MessageTable {...mockProps} isLoading={true} />);
    const spinContainer = screen.getByTestId("loading-spinner");
    expect(spinContainer).toHaveClass("ant-spin", "ant-spin-spinning");
  });

  it("handles pagination change", () => {
    render(<MessageTable {...mockProps} />);
    const nextPageButton = screen.getByLabelText("right");
    fireEvent.click(nextPageButton);
    expect(mockProps.onPaginationChange).toHaveBeenCalledWith(2, 10);
  });

  it("disables table interaction when loading", () => {
    render(<MessageTable {...mockProps} isLoading={true} />);
    const spinContainer = screen.getByTestId("loading-spinner");
    expect(spinContainer).toHaveClass("ant-spin", "ant-spin-spinning");
    const blurContainer = spinContainer.parentElement?.nextElementSibling;
    expect(blurContainer).toHaveClass("ant-spin-container", "ant-spin-blur");
  });

  it("shows empty state when no messages", () => {
    render(<MessageTable {...mockProps} messages={[]} />);
    expect(screen.getByText("No messages found")).toBeInTheDocument();
  });
});
