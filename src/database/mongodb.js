
import mongoose from "mongoose";

async function connectMongoDB() {
    const uri = "mongodb+srv://manojkumaryanamala641_db_user:5CqJDREmCEYxYoPB@cluster0.so0gm0b.mongodb.net/";

    if (!uri) {
        throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(uri);

    console.log("Connected to MongoDB Atlas");
}

export default connectMongoDB;
