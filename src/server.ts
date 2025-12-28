import app from "./app";
import { prisma } from "./lib/prisma";
const PORT = process.env.PORT || 5000;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    app.listen(PORT, () => {
      console.log(`Draftly server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("An error has occured", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
