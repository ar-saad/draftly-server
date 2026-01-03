import { prisma } from "../lib/prisma";

const seedAdmin = async () => {
  try {
    const adminData = {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      role: process.env.ADMIN_ROLE,
      password: process.env.ADMIN_PASS,
    };

    // Check if we already have admin account
    const existingAdmin = await prisma.user.findUnique({
      where: {
        email: adminData.email as string,
      },
    });

    if (existingAdmin) {
      throw new Error("Admin account already exists!!!");
    }

    const signupAdmin = await fetch(
      `${process.env.SERVER_URL}/api/auth/sign-up/email`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(adminData),
      }
    );

    if (signupAdmin.ok) {
      await prisma.user.update({
        where: {
          email: adminData.email as string,
        },
        data: {
          emailVerified: true,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};
seedAdmin();
