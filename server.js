// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/post.js";
import commentRoutes from "./routes/comment.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // 나중에 프론트 포트
    credentials: true,
  })
);
app.use(express.json());

app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

app.get("/", (req, res) => {
  res.send("백엔드 서버 정상 작동 중입니다!");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB 연결 성공");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 서버 실행: http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));
