import express from "express";
import User from "./../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

console.log("✅ auth.js 라우터 불러옴");

const router = express.Router();

// 회원가입
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPw = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPw });
    await newUser.save();
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "유저 없음" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "비밀번호 불일치" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res
      .cookie("token", token, {
        httpOnly: true, // JavaScript에서 접근 불가. XSS 방지용. 프론트에서는 JS로 이 쿠키를 못 읽음
        secure: false, // HTTPS일 경우 true (배포 시만 true)
        sameSite: "lax", // CSRF 대응 (필요 시 "strict" 또는 "none")
      })
      .status(200)
      .json({ message: "로그인 성공" });
  } catch (err) {
    res.status(500).json({ message: "로그인 실패", error: err.message });
  }
});

export default router;
