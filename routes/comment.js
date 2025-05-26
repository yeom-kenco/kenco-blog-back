import express from "express";
import Comment from "../models/Comment.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 댓글 작성
router.post("/", verifyToken, async (req, res) => {
  const { content, postId } = req.body;

  try {
    const newComment = new Comment({
      content,
      post: postId,
      author: req.userId,
    });

    await newComment.save();
    res.status(201).json({ message: "댓글 작성 완료", comment: newComment });
  } catch (err) {
    res.status(500).json({ message: "댓글 작성 실패", error: err.message });
  }
});

// 댓글 조회 (특정 글에 대한)
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(5); // 최신 5개만

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "댓글 조회 실패", error: err.message });
  }
});

// 댓글 수정
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "댓글 없음" });

    if (comment.author.toString() !== req.userId)
      return res.status(403).json({ message: "권한 없음" });

    comment.content = req.body.content || comment.content;
    const updated = await comment.save();

    res.status(200).json({ message: "수정 완료", comment: updated });
  } catch (err) {
    res.status(500).json({ message: "수정 실패", error: err.message });
  }
});

// 댓글 삭제
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "댓글 없음" });

    if (comment.author.toString() !== req.userId)
      return res.status(403).json({ message: "권한 없음" });

    await Comment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "삭제 완료" });
  } catch (err) {
    res.status(500).json({ message: "삭제 실패", error: err.message });
  }
});

export default router;
