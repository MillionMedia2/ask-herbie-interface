"use server";
import { getServerAxios } from "../../axiosInstance";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";
import type { IMessage, RecommendedProductsPayload } from "@/types";

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
        recommendedProducts: msg.recommendedProducts || undefined,
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
  userId?: number;
}) => {
  const axiosInstance = await getServerAxios();
  try {
    const requestBody: any = {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
    };

    // Add userId if provided (for logged-in users)
    if (data.userId !== undefined) {
      requestBody.userId = data.userId;
    }

    const response = await axiosInstance.post(`/messages`, requestBody);

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

export const patchMessageRecommendedProducts = async (
  messageId: string,
  data: RecommendedProductsPayload
) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.patch(
      `/messages/${messageId}/recommended-products`,
      {
        count: data.count,
        ...(data.category !== undefined && data.category !== ""
          ? { category: data.category }
          : {}),
        products: data.products,
      }
    );

    if (response.data.success && response.data.data) {
      const msg = response.data.data;
      return {
        id: msg._id || msg.id,
        conversationId:
          msg.conversationId?._id || msg.conversationId || "",
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        recommendedProducts: msg.recommendedProducts,
      } as IMessage;
    }

    return handleApiErrorWithoutException(
      new Error("Failed to save recommended products")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};

export const deleteMessage = async (messageId: string) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.delete(`/messages/${messageId}`);

    if (response.data.success) {
      return { success: true };
    }

    return handleApiErrorWithoutException(
      new Error("Failed to delete message")
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};
