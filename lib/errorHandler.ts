import axios, { AxiosError } from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleApiErrorWithoutException = (error: any) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "An error occurred";
    const statusCode = axiosError.response?.status || 500;

    return {
      error: "Error occured",
      message,
      statusCode,
    };
    // throw new ApiError(message, statusCode);
  } else if (error instanceof Error) {
    return {
      error: "Error occured",
      message: error.message || "An unknown error occurred",
      statusCode: 500,
    };
    // throw new ApiError(error.message || 'An unknown error occurred', 500);
  } else {
    return {
      error: "Error occured",
      message: error.message,
      statusCode: error.code,
    };
    // throw new ApiError(error.message, error.code);
  }
};
