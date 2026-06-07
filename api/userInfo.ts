"use server";

import { WORDPRESS_URL } from "@/constants/constants";
import { getServerAxios } from "@/services/axiosInstance";

/** Fetches the WordPress user from the external API using the shared axios instance. */
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

    return response.data;
  } catch (error) {
    throw error;
  }
}
