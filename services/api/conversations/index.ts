"use server";
import { getServerAxios } from "../../axiosInstance";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";
import type { IConversation } from "@/types";

export const fetchConversations = async () => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.get(`/conversations`);

    if (response.data.success && response.data.data) {
      // Transform backend data to match frontend format
      return response.data.data.map((conv: any) => ({
        id: conv._id || conv.id,
        title: conv.title,
        participants: conv.participants || ["user", "assistant"],
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt || conv.createdAt,
        isPinned: conv.isPinned || false,
      }));
    }

    return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};

export const createConversation = async (data: {
  title: string;
  participants?: string[];
  userId?: number;
}) => {
  const axiosInstance = await getServerAxios();
  try {
    const requestBody: any = {
      title: data.title,
      participants: data.participants || ["user", "assistant"],
    };

    // Add userId if provided (for logged-in users)
    if (data.userId !== undefined) {
      requestBody.userId = data.userId;
    }

    const response = await axiosInstance.post(`/conversations`, requestBody);

    if (response.data.success && response.data.data) {
      const conv = response.data.data;
      return {
        id: conv._id || conv.id,
        title: conv.title,
        participants: conv.participants || ["user", "assistant"],
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt || conv.createdAt,
        isPinned: conv.isPinned || false,
      };
    }

    return handleApiErrorWithoutException(
      new Error("Failed to create conversation")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};

export const updateConversation = async (
  id: string,
  updateData: Partial<IConversation>
) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.put(
      `/conversations/${id}`,
      updateData
    );

    if (response.data.success && response.data.data) {
      const conv = response.data.data;
      return {
        id: conv._id || conv.id,
        title: conv.title,
        participants: conv.participants || ["user", "assistant"],
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt || conv.createdAt,
        isPinned: conv.isPinned || false,
      };
    }

    return handleApiErrorWithoutException(
      new Error("Failed to update conversation")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};

export const deleteConversation = async (id: string) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.delete(`/conversations/${id}`);

    if (response.data.success) {
      return { success: true };
    }

    return handleApiErrorWithoutException(
      new Error("Failed to delete conversation")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};

export const pinConversation = async (id: string, isPinned: boolean) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.patch(`/conversations/${id}/pin`, {
      isPinned,
    });

    if (response.data.success && response.data.data) {
      const conv = response.data.data;
      return {
        id: conv._id || conv.id,
        title: conv.title,
        participants: conv.participants || ["user", "assistant"],
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt || conv.createdAt,
        isPinned: conv.isPinned || false,
      };
    }

    return handleApiErrorWithoutException(
      new Error("Failed to pin conversation")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};
