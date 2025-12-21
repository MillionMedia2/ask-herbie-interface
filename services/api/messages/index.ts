"use server";
import { getServerAxios } from "../../axiosInstance";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";
import type { IMessage } from "@/types";

export const fetchMessages = async (conversationId: string) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.get(`/messages/${conversationId}`);

    if (response.data.success && response.data.data) {
      // Transform backend data to match frontend format
      return response.data.data.map((msg: any) => ({
        id: msg._id || msg.id,
        conversationId:
          msg.conversationId?._id || msg.conversationId || conversationId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
      }));
    }

    return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};

export const createMessage = async (data: {
  conversationId: string;
  senderId: string;
  content: string;
}) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.post(`/messages`, {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
    });

    if (response.data.success && response.data.data) {
      const msg = response.data.data;
      return {
        id: msg._id || msg.id,
        conversationId:
          msg.conversationId?._id || msg.conversationId || data.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
      };
    }

    return handleApiErrorWithoutException(
      new Error("Failed to create message")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};
