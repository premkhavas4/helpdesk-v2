import "express";

declare global {
  namespace Express {
    interface Request {
      sessionUser?: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}
