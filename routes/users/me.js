import express from "express";
import bcrypt from "bcryptjs";
import { verifyToken } from "../../middleware/auth.js";
import Post from "../../models/Post.js";
import User from "../../models/User.js";
import Comment from "../../models/Comment.js";
import { upload } from "./../../middleware/upload.js";

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
  try {
    const comments = await Comment.find({ author: req.userId })
      .populate("post", "title createdAt") // ✅ 여기 추가
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "내 댓글 조회 실패", error: err.message });
  }
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

router.delete("/", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. 유저의 글/댓글 삭제
    await Post.deleteMany({ author: userId });
    await Comment.deleteMany({ author: userId });

    // 2. 유저 계정 삭제
    await User.findByIdAndDelete(userId);

    res.clearCookie("token").status(200).json({ message: "회원 탈퇴 완료" });
  } catch (err) {
    res.status(500).json({ message: "회원 탈퇴 실패", error: err.message });
  }
});

router.patch("/password", verifyToken, async (req, res) => {
  const { currentPw, newPw } = req.body;
  try {
    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPw, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ message: "현재 비밀번호가 일치하지 않습니다." });

    const hashed = await bcrypt.hash(newPw, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({ message: "비밀번호 변경 완료" });
  } catch (err) {
    res.status(500).json({ message: "비밀번호 변경 실패", error: err.message });
  }
});

router.patch(
  "/profile-img",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { profileImg: `/uploads/${req.file.filename}` },
        { new: true }
      );
      res.status(200).json({ message: "업로드 성공", user });
    } catch (err) {
      res.status(500).json({ message: "업로드 실패", error: err.message });
    }
  }
);

export default router;
