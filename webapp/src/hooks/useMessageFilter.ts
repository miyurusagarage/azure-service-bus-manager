import { useMemo } from "react";
import type { ServiceBusMessage } from "../types/serviceBus";

export const useMessageFilter = (messages: ServiceBusMessage[], searchTerm: string) => {
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    const term = searchTerm.toLowerCase();
    return messages.filter((msg) => {
      const body = typeof msg.body === "string" ? msg.body : JSON.stringify(msg.body);
      return body.toLowerCase().includes(term);
    });
  }, [messages, searchTerm]);

  return filteredMessages;
};
