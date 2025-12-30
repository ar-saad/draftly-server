import { Response } from 'express';

export const sendResponse = (
  data: {
    statusCode: number;
    success: boolean;
    message: string;
    data: any;
  },
  res: Response,
) => {
  return res.status(data?.statusCode).json({
    success: true,
    message: data?.message || 'Request successful',
    data,
  });
};
