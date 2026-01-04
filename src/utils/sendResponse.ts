import { Response } from "express";

export const sendResponse = (
  resData: {
    statusCode: number;
    success: boolean;
    message: string;
    data: any;
  },
  res: Response
) => {
  return res.status(resData?.statusCode).json({
    success: true,
    message: resData?.message || "Request successful",
    data: resData.data,
  });
};
