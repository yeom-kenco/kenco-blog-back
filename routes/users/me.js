// routes/users/me.js
import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import Post from "../../models/Post.js";
import Comment from "../../models/Comment.js";

const router = express.Router();

router.get("/posts", verifyToken, async (req, res) => {
  const posts = await Post.find({ author: req.userId }).sort({ createdAt: -1 });
  res.json(posts);
});

router.get("/liked", verifyToken, async (req, res) => {
  const posts = await Post.find({ likes: req.userId }).sort({ createdAt: -1 });
  res.json(posts);
});

router.get("/comments", verifyToken, async (req, res) => {
  const comments = await Comment.find({ author: req.userId })
    .populate("post", "title")
    .sort({ createdAt: -1 });
  res.json(comments);
});

export default router;
