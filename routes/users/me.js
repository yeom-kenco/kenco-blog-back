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

router.patch("/", verifyToken, async (req, res) => {
  const { username } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { username },
      { new: true }
    );

    res.status(200).json({
      message: "수정 완료",
      user: {
        _id: updated._id,
        username: updated.username,
        email: updated.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "수정 실패", error: err.message });
  }
});

export default router;
