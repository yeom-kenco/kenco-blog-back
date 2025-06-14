// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/post.js";
import commentRoutes from "./routes/comment.js";
import userRoutes from "./routes/user.js";
import userMeRoutes from "./routes/users/me.js";
import uploadRoutes from "./routes/uploads.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN || "*", // 프론트 포트
    credentials: true,
  })
);
app.use(express.json());

app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users/me", userMeRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("백엔드 서버 정상 작동 중입니다!");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB 연결 성공");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 서버 실행: http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));
