import express from "express";
import User from "./../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    if (!user) {
      return res.status(400).json({ message: "유저 없음" }); // ✅ 방어 코드
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호 불일치" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .status(200)
      .json({
        message: "로그인 성공",
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
        },
      });
  } catch (err) {
    console.error("❗로그인 실패:", err); // ← 콘솔에 에러 꼭 찍어보자!
    res.status(500).json({ message: "로그인 실패", error: err.message });
  }
});

// 로그아웃
router.post("/logout", (req, res) => {
  res.clearCookie("token").status(200).json({ message: "로그아웃 성공" });
});

router.get("/check", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "토큰 없음" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id email username");
    if (!user) return res.status(404).json({ message: "사용자 없음" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "토큰 만료 또는 유효하지 않음" });
  }
});

export default router;
