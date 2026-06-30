import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // แกะข้อมูลที่หน้าบ้านส่งมา
    const { user_api_key, ai_model, market_data } = req.body;

    if (!user_api_key) {
      return res.status(400).json({ error: 'กรุณากรอก API Key บนหน้าจอก่อนใช้งาน' });
    }

    // เรียกใช้ AI โดยใช้ API Key ที่ผู้ใช้กรอกเข้ามาตรงๆ
    const ai = new GoogleGenAI({ apiKey: user_api_key });

    const response = await ai.models.generateContent({
      model: ai_model || 'gemini-2.5-flash', // ถ้าไม่ได้เลือก ให้ดึงตัวนี้เป็น default
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'คุณคือ AI วิเคราะห์ความเสี่ยงพอร์ตเทรดทองคำ...'
      },
      contents: JSON.stringify(market_data)
    });

    return res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    return res.status(500).json({ error: 'การเชื่อมต่อ API ล้มเหลว โปรดตรวจสอบ Key ของคุณ' });
  }
}
