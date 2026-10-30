import mongoose from "mongoose";
import dns from "dns";

// Fix querySrv ECONNREFUSED on Windows / local DNS resolvers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_DB_URI || process.env.MONGO_URL;
        if (!uri) {
            throw new Error("Neither MONGO_DB_URI nor MONGO_URL is defined in environment variables");
        }
        await mongoose.connect(uri);
        console.log(`MongoDB Connected Successfully ✅`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
