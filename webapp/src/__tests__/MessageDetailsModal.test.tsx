import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { MessageDetailsModal } from "../components/MessageDetailsModal";
import type { ServiceBusMessage } from "../types/serviceBus";

describe("MessageDetailsModal", () => {
  const mockMessage: ServiceBusMessage = {
    messageId: "test-message-id",
    body: { test: "data" },
    sequenceNumber: BigInt(123),
    enqueuedTime: new Date("2024-03-20T10:00:00Z"),
    contentType: "application/json",
    correlationId: "test-correlation-id",
    subject: "Test Subject",
    to: "test-destination",
    replyTo: "test-reply-to",
    sessionId: "test-session",
    timeToLive: 3600000,
    applicationProperties: { customProp: "value" },
    systemProperties: { sysProp: "value" },
  };

  const mockOnClose = vi.fn();

  beforeAll(() => {
    // Mock clipboard API
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("renders null when message is null", () => {
    const { container } = render(
      <MessageDetailsModal visible={true} onClose={mockOnClose} message={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays all message properties correctly", () => {
    const message: ServiceBusMessage = {
      messageId: "test-message-id",
      sequenceNumber: BigInt(123),
      contentType: "json",
      enqueuedTime: new Date("2024-03-20T11:00:00Z"),
      body: { test: "data" },
      applicationProperties: { customProp: "value" },
      systemProperties: { sysProp: "value" },
    };

    render(<MessageDetailsModal visible={true} onClose={mockOnClose} message={message} />);

    // Check basic properties
    expect(screen.getByText("Message ID")).toBeInTheDocument();
    expect(screen.getByText("test-message-id")).toBeInTheDocument();
    expect(screen.getByText("Sequence Number")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("Content Type")).toBeInTheDocument();
    expect(screen.getByText("json")).toBeInTheDocument();
    expect(screen.getByText("Enqueued Time")).toBeInTheDocument();
    const enqueuedTimeCell = screen.getByText("Enqueued Time").nextElementSibling;
    expect(enqueuedTimeCell).toBeInTheDocument();

    // Check message body
    expect(screen.getByText("Body")).toBeInTheDocument();
    const bodyPre = screen.getByText((content) => content.includes('"test": "data"'));
    expect(bodyPre).toBeInTheDocument();

    // Check properties sections
    expect(screen.getByText("Application Properties")).toBeInTheDocument();
    const appPropsPre = screen.getByText((content) => content.includes('"customProp": "value"'));
    expect(appPropsPre).toBeInTheDocument();

    expect(screen.getByText("System Properties")).toBeInTheDocument();
    const sysPropsPre = screen.getByText((content) => content.includes('"sysProp": "value"'));
    expect(sysPropsPre).toBeInTheDocument();
  });

  it("handles copy button click", async () => {
    render(<MessageDetailsModal visible={true} onClose={mockOnClose} message={mockMessage} />);

    const copyButton = screen.getByText("Copy");
    await fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockMessage.body, null, 2)
    );
  });

  it("calls onClose when modal is closed", () => {
    render(<MessageDetailsModal visible={true} onClose={mockOnClose} message={mockMessage} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles missing optional properties", () => {
    const minimalMessage: ServiceBusMessage = {
      body: { test: "data" },
    };

    render(<MessageDetailsModal visible={true} onClose={mockOnClose} message={minimalMessage} />);

    // Check that all optional properties show N/A
    const messageIdCell = screen.getByText("Message ID").nextElementSibling;
    expect(messageIdCell).toHaveTextContent("N/A");

    const sequenceNumberCell = screen.getByText("Sequence Number").nextElementSibling;
    expect(sequenceNumberCell).toHaveTextContent("N/A");

    const contentTypeCell = screen.getByText("Content Type").nextElementSibling;
    expect(contentTypeCell).toHaveTextContent("N/A");

    const enqueuedTimeCell = screen.getByText("Enqueued Time").nextElementSibling;
    expect(enqueuedTimeCell).toHaveTextContent("N/A");
  });

  it("does not show properties sections when empty", () => {
    const messageWithoutProps: ServiceBusMessage = {
      messageId: "test",
      body: { test: "data" },
    };

    render(
      <MessageDetailsModal visible={true} onClose={mockOnClose} message={messageWithoutProps} />
    );

    expect(screen.queryByText("Application Properties")).not.toBeInTheDocument();
    expect(screen.queryByText("System Properties")).not.toBeInTheDocument();
  });
});
