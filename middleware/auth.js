import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "인증 필요" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "토큰이 유효하지 않음" });
  }
};

// 인증이 필요한 라우터 예시
// import { verifyToken } from "../middleware/auth.js";

// router.post("/posts", verifyToken, (req, res) => {
//   const userId = req.userId; // 미들웨어에서 주입됨
//   // 글쓰기 로직...
// });
