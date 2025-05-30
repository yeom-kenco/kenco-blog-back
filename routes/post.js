import express from "express";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Comment from "../models/Comment.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 글쓰기
router.post("/", verifyToken, async (req, res) => {
  const { title, content } = req.body;

  try {
    const newPost = new Post({
      title,
      content,
      author: req.userId,
    });

    await newPost.save();
    res.status(201).json({ message: "게시글 작성 완료", post: newPost });
  } catch (err) {
    res.status(500).json({ message: "글쓰기 실패", error: err.message });
  }
});

// 글 목록 조회 (페이지네이션)
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const totalCount = await Post.countDocuments();
    const posts = await Post.find()
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // plain JS object로 반환

    // ✅ 댓글 수 계산하여 붙이기
    const postsWithCommentCounts = await Promise.all(
      posts.map(async (post) => {
        try {
          const commentCount = await Comment.countDocuments({ post: post._id });
          return { ...post, commentCount };
        } catch (err) {
          console.error("❗댓글 수 조회 실패:", err.message);
          return { ...post, commentCount: 0 }; // 실패해도 기본값으로 fallback
        }
      })
    );

    res.status(200).json({
      posts: postsWithCommentCounts,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("❗ posts GET error:", err);
    res
      .status(500)
      .json({ message: "글 목록 불러오기 실패", error: err.message });
  }
});

// 게시글 상세 조회
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id).populate("author", "username");
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "게시글 조회 실패", error: err.message });
  }
});

// 글 수정
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });
    if (post.author.toString() !== req.userId)
      return res.status(403).json({ message: "권한 없음" });

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;

    const updatedPost = await post.save();
    res.status(200).json({ message: "수정 완료", post: updatedPost });
  } catch (err) {
    res.status(500).json({ message: "수정 실패", error: err.message });
  }
});

// 글 삭제 + 이미지 파일 삭제
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });
    if (post.author.toString() !== req.userId)
      return res.status(403).json({ message: "권한 없음" });

    // 📌 content 안에서 이미지 경로 추출
    const regex = /\/uploads\/[^\s"']+/g;
    const matches = post.content.match(regex);

    if (matches) {
      matches.forEach((relativeUrl) => {
        const filePath = path.join(__dirname, "..", relativeUrl);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.warn("❗ 이미지 삭제 실패:", filePath, err.message);
          } else {
            console.log("✅ 이미지 삭제:", filePath);
          }
        });
      });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "게시글 및 이미지 삭제 완료" });
  } catch (err) {
    res.status(500).json({ message: "삭제 실패", error: err.message });
  }
});

// 좋아요 토글
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });

    const alreadyLiked = post.likes.includes(req.userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
      await post.save();
      return res.status(200).json({ message: "좋아요 취소", liked: false });
    } else {
      post.likes.push(req.userId);
      await post.save();
      return res.status(200).json({ message: "좋아요 완료", liked: true });
    }
  } catch (err) {
    res.status(500).json({ message: "좋아요 처리 실패", error: err.message });
  }
});

export default router;
