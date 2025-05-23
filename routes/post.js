import express from "express";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 글쓰기 API
router.post("/", verifyToken, async (req, res) => {
  const { title, content } = req.body;

  try {
    const newPost = new Post({
      title,
      content, // HTML string 그대로 저장
      author: req.userId, // 인증된 사용자
    });

    await newPost.save();
    res.status(201).json({ message: "게시글 작성 완료", post: newPost });
  } catch (err) {
    res.status(500).json({ message: "글쓰기 실패", error: err.message });
  }
});

// 글 목록 조회 (최신순, 10개만)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username") // 작성자 이름 포함
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "글 목록 불러오기 실패", error: err.message });
  }
});

export default router;
