import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // บังคับให้รับคำขอผ่าน POST เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { user_api_key, ai_model, market_data } = req.body;

    if (!user_api_key) {
      return res.status(400).json({ error: 'กรุณากรอก API Key บนหน้าจอก่อนใช้งาน' });
    }

    // เรียกใช้ SDK ของ Google โดยการส่ง Key ตรงไปตรงมาจาก Client หน้าบราวเซอร์ของคุณ
    const ai = new GoogleGenAI({ apiKey: user_api_key });

    const systemInstruction = `
      คุณคือ AI ผู้เชี่ยวชาญระดับสูงด้านสถิติการลงทุนและผู้ดูแลความเสี่ยงของระบบเทรดทองคำ (XAUUSD Expert Advisor) 
      หน้าที่ของคุณคือการวิเคราะห์ตัวเลขสถิติของพอร์ตและข้อมูลความพร้อมที่ส่งมาให้แบบ Real-time
      
      ให้ประมวลผลคำตอบออกมาในรูปแบบโครงสร้าง JSON ภาษาไทย เท่านั้น (ห้ามพิมพ์ข้อความอธิบายใดๆ ด้านนอก) ตาม Format นี้:
      {
        "portfolio_summary": "สรุปผลประกอบการปัจจุบัน ความเสี่ยงที่พบใน Position ที่ถืออยู่ และคำแนะนำสั้นๆ 1-2 ประโยค",
        "risk_alert_level": "LOW / MEDIUM / HIGH",
        "strategies_readiness": [
          {
            "name": "ชื่อกลยุทธ์ (ให้ตรงกับช่อง label ของข้อมูลที่ส่งมา)",
            "readiness_score": 85, 
            "reason": "อธิบายเหตุผลสั้นๆ 1 ประโยคว่าสภาวะตลาดหรือค่าสถิตินี้ ทำไมจึงควรเปิดหรือปิดการทำงานของกลยุทธ์นี้"
          }
        ]
      }
      
      หลักเกณฑ์พิจารณาความพร้อม (Readiness Score):
      - หากพอร์ตมีค่า Drawdown ปัจจุบันสูงเกิน 5% หรือ Free Margin เริ่มเหลือน้อย ให้พิจารณาปรับคะแนนความพร้อมลดลงต่ำกว่า 65% ในกลยุทธ์ที่มีความเสี่ยงสูง
      - ให้คำนวณสัดส่วนชนะ (Win rate) ควบคู่กับจำนวนเงื่อนไขผ่านในตัวแปรกลยุทธ์
    `;

    const response = await ai.models.generateContent({
      model: ai_model || 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        systemInstruction: systemInstruction,
        temperature: 0.3 // ตั้งค่าความแม่นยำต่ำเพื่อให้ประมวลผลตัวเลขคงที่ ไม่มโนไปเอง
      },
      contents: JSON.stringify(market_data)
    });

    const aiAnalysis = JSON.parse(response.text);
    return res.status(200).json(aiAnalysis);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'การตรวจสอบผ่าน AI ล้มเหลว โปรดตรวจสอบ API Key ของคุณ' });
  }
}
