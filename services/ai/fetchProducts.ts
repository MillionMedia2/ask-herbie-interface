"use server";
import { getServerAxios } from "../axiosInstance";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";

type fetchProductsProps = {
  message: string;
};

export const fetchProducts = async (data: fetchProductsProps) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.post(`/classify-products`, data);

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};
