import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB, { isMongoConnected } from "./utils/db.js";
import { seedInitialData } from "./utils/seedLocalDb.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL.replace(/\/$/, ""), 'http://localhost:5173']
    : ['http://localhost:5173'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8000;

// Health check endpoint
app.get("/health", (req, res) => {
    return res.status(200).json({ 
        status: "ok", 
        message: "Server is healthy", 
        mode: isMongoConnected ? "MongoDB Atlas/Cluster" : "Local Database Engine",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date() 
    });
});

// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

// Serve frontend static bundle if in production
if (process.env.NODE_ENV === "production") {
    const frontendDist = path.resolve(__dirname, "../frontend/dist");
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) return next();
        res.sendFile(path.resolve(frontendDist, "index.html"));
    });
}

// global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    return res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        success: false
    });
});

app.listen(PORT, async () => {
    await connectDB();
    if (!isMongoConnected) {
        await seedInitialData();
    }
    console.log(`Server running at port ${PORT} [Mode: ${isMongoConnected ? 'MongoDB' : 'Local DB'}]`);
})