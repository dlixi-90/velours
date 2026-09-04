import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_MESSAGE_MAX_LENGTH,
  sendAIMessage,
} from "../apis/aiService";

const createMessageId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createMessage = ({
  role,
  content,
  status = "sent",
  toolsUsed = [],
  products = [],
  orders = [],
  cart = null,
  pendingCartAction = null,
}) => ({
  id: createMessageId(),
  role,
  content,
  status,
  toolsUsed,
  products,
  orders,
  cart,
  pendingCartAction,
  createdAt: new Date().toISOString(),
});

export const useAIAgent = ({ getToken }) => {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const activeRequestRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      activeRequestRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (message) => {
      const normalizedMessage = String(message || "").trim();

      if (!normalizedMessage) {
        setError("Vui lòng nhập nội dung tin nhắn");
        return null;
      }

      if (normalizedMessage.length > AI_MESSAGE_MAX_LENGTH) {
        setError(
          `Tin nhắn không được vượt quá ${AI_MESSAGE_MAX_LENGTH} ký tự`,
        );
        return null;
      }

      if (activeRequestRef.current) {
        setError("Vui lòng chờ trợ lý AI trả lời tin nhắn hiện tại");
        return null;
      }

      const userMessage = createMessage({
        role: "user",
        content: normalizedMessage,
        status: "sending",
      });
      const requestController = new AbortController();

      activeRequestRef.current = requestController;
      setMessages((currentMessages) => [...currentMessages, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const data = await sendAIMessage({
          message: normalizedMessage,
          history: messages,
          getToken,
          signal: requestController.signal,
        });

        if (!isMountedRef.current) return null;

        const assistantMessage = createMessage({
          role: "assistant",
          content: data.message,
          toolsUsed: Array.isArray(data.toolsUsed) ? data.toolsUsed : [],
          products: Array.isArray(data.products) ? data.products : [],
          orders: Array.isArray(data.orders) ? data.orders : [],
          cart:
            data.cart && typeof data.cart === "object" ? data.cart : null,
          pendingCartAction:
            data.pendingCartAction &&
            typeof data.pendingCartAction === "object"
              ? data.pendingCartAction
              : null,
        });

        setMessages((currentMessages) => [
          ...currentMessages.map((currentMessage) =>
            currentMessage.id === userMessage.id
              ? { ...currentMessage, status: "sent" }
              : currentMessage,
          ),
          assistantMessage,
        ]);

        return assistantMessage;
      } catch (requestError) {
        if (!isMountedRef.current) return null;

        const wasCancelled = requestController.signal.aborted;

        setMessages((currentMessages) =>
          currentMessages.map((currentMessage) =>
            currentMessage.id === userMessage.id
              ? {
                  ...currentMessage,
                  status: wasCancelled ? "cancelled" : "failed",
                }
              : currentMessage,
          ),
        );

        if (!wasCancelled) {
          setError(requestError.message || "Trợ lý AI không thể trả lời");
        }

        return null;
      } finally {
        if (
          isMountedRef.current &&
          activeRequestRef.current === requestController
        ) {
          activeRequestRef.current = null;
          setIsSending(false);
        }
      }
    },
    [getToken, messages],
  );

  const cancelRequest = useCallback(() => {
    activeRequestRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    activeRequestRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isSending,
    error,
    sendMessage,
    cancelRequest,
    clearMessages,
    clearError,
  };
};

export default useAIAgent;
