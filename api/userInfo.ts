"use server";

import { WORDPRESS_URL } from "@/constants/constants";
import { getServerAxios } from "@/services/axiosInstance";

/** Logs the WordPress user returned by the external API using the shared axios instance. */
export async function logWordPressUserInfo(token: string) {
  const axiosInstance = await getServerAxios();

  try {
    const response = await axiosInstance.get(
      `${WORDPRESS_URL}/wp-json/herbi/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("WordPress User:", response.data);
    return response.data;
  } catch (error) {
    console.error("Auth failed", error);
    throw error;
  }
}
