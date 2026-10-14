const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// เก็บรายชื่อผู้เล่นหรือ Session ที่กำลังออนไลน์อยู่ พร้อมเวลาที่ Ping ล่าสุด
// ใช้ Map หรือ Object เพื่อเก็บ { userId: timestamp }
let activeUsers = new Map();

// ระยะเวลาที่จะนับว่าออฟไลน์ (เช่น ถ้าหายไปนานกว่า 15 Seconds ถือว่าออกเกมแล้ว)
const TIMEOUT_DURATION = 15 * 1000; 

// Middleware สำหรับอ่าน JSON
app.use(express.json());

// 1. Endpoint สำหรับให้ Roblox ยิงเข้ามาเพื่อรายงานตัวว่ายังออนไลน์อยู่ (Heartbeat/Ping)
app.post('/ping', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    // บันทึกหรืออัปเดตเวลาล่าสุดที่ผู้เล่นคนนี้ส่งสัญญาณมา
    activeUsers.set(userId, Date.now());
    
    res.status(200).json({ status: 'success', activeCount: activeUsers.size });
});

// 2. Endpoint สำหรับให้ UI ใน Roblox ดึงตัวเลขจำนวนคนออนไลน์ไปแสดงผล
app.get('/get-count', (req, res) => {
    const currentTime = Date.now();

    // กรองเอาเฉพาะคนที่ยังส่งสัญญาณมาภายในเวลาที่กำหนด (เคลียร์คนที่หลุดหรือปิดเกมออกไป)
    for (let [userId, lastPing] of activeUsers.entries()) {
        if (currentTime - lastPing > TIMEOUT_DURATION) {
            activeUsers.delete(userId);
        }
    }

    // ส่งจำนวนคนปัจจุบันกลับไป
    res.status(200).json({ count: activeUsers.size });
});

// เริ่มรันเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
