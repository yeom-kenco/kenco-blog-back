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

// 게시글 상세 조회
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id).populate("author", "username");

    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

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

// 글 삭제
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });

    if (post.author.toString() !== req.userId)
      return res.status(403).json({ message: "권한 없음" });

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "삭제 완료" });
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
