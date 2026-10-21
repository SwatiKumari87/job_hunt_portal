import mongoose from "mongoose";

export let isMongoConnected = false;

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("<username>") || process.env.MONGO_URI.includes("cluster0.xxxxx")) {
            console.log('⚡ No external MongoDB URI configured. Running in Local Database Mode.');
            isMongoConnected = false;
            return;
        }
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2500 });
        isMongoConnected = true;
        console.log('mongodb connected successfully');
    } catch (error) {
        isMongoConnected = false;
        console.log('⚡ External MongoDB unreachable. Seamlessly active in Local Database Mode.');
    }
}
export default connectDB;