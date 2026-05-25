"use server";
import { getServerAxios } from "../axiosInstance";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";

type fetchProductsProps = {
  messages: Array<{
    senderId: string;
    content: string;
  }>;
};

export const fetchProducts = async (data: fetchProductsProps) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.post(`/recommend-products`, data);

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};
