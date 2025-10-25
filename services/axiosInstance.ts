"use server";
import axios from "axios";
// import { getTokensFromCookies } from "@/lib/cookies";
import { API_URL } from "@/constants/constants";

const API_BASE_URL = API_URL;

export const getServerAxios = async () => {
  // const accessToken = await getTokensFromCookies();

  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      // Authorization: `Bearer ${accessToken}`,
    },
  });

  return instance;
};
