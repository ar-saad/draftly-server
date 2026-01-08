import { User } from "../../prisma/generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        role: string;
      };
    }
  }
}
