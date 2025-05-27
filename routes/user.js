import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// 내 글 목록
router.get("/my/posts", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "내 글 목록 조회 실패", error: err.message });
  }
});

// 좋아요한 글 목록
router.get("/my/liked", verifyToken, async (req, res) => {
  try {
    const likedPosts = await Post.find({ likes: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(likedPosts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "좋아요한 글 조회 실패", error: err.message });
  }
});

// 내 댓글 목록
router.get("/my/comments", verifyToken, async (req, res) => {
  try {
    const comments = await Comment.find({ author: req.userId })
      .populate("post", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "내 댓글 조회 실패", error: err.message });
  }
});

// 유저 정보 수정
router.put("/my/info", verifyToken, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.findById(req.userId);

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updated = await user.save();
    res.status(200).json({ message: "유저 정보 수정 완료", user: updated });
  } catch (err) {
    res.status(500).json({ message: "유저 수정 실패", error: err.message });
  }
});

// 회원 탈퇴
router.delete("/my/delete", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.clearCookie("token"); // JWT 쿠키 삭제
    res.status(200).json({ message: "회원 탈퇴 완료" });
  } catch (err) {
    res.status(500).json({ message: "회원 탈퇴 실패", error: err.message });
  }
});

export default router;
