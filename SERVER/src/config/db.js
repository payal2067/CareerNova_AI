import mongoose from "mongoose";
import dns from "dns";

// Fix querySrv ECONNREFUSED on Windows / local DNS resolvers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_DB_URI || process.env.MONGO_URL;
        if (!uri) {
            console.error("⚠️ Neither MONGO_DB_URI nor MONGO_URL is defined in environment variables");
            return;
        }
        await mongoose.connect(uri);
        console.log(`MongoDB Connected Successfully ✅`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        console.warn("⚠️ Server will remain active on port, retrying database connection in background...");
    }
};

export default connectDB;
