// routes/uploads.js
import express from "express";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// 이미지 하나 업로드
router.post("/image", upload.single("image"), (req, res) => {
  try {
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: filePath });
  } catch (err) {
    res.status(500).json({ message: "이미지 업로드 실패", error: err.message });
  }
});

export default router;
