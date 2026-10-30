import mongoose from "mongoose";
import dns from "dns";

// Fix querySrv ECONNREFUSED on Windows / local DNS resolvers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI);
        console.log(`MongoDB Connected Successfully ✅`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
