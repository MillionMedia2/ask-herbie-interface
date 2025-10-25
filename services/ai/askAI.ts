"use server";
import { getServerAxios } from "../axiosInstance";
import { handleApiErrorWithoutException } from "@/lib/errorHandler";

type askAIProps = {
  question: string;
};

export const askAI = async (data: askAIProps) => {
  const axiosInstance = await getServerAxios();
  try {
    const response = await axiosInstance.post(`/ask`, data);

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiErrorWithoutException(error);
  }
};
