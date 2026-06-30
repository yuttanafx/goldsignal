import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { user_api_key, ai_model, symbols_to_analyze, account_summary } = req.body;

    if (!user_api_key || !symbols_to_analyze) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
    }

    const ai = new GoogleGenAI({ apiKey: user_api_key });

    const systemInstruction = `
      คุณคือระบบคัดกรองทางเทคนิคอัจฉริยะ (AI Asset Screener) หน้าที่ของคุณคือวิเคราะห์สภาวะตลาดของสัญลักษณ์ที่ได้รับในอาเรย์ symbols_to_analyze
      
      ให้คุณจำลองหรือใช้ความรู้ด้านเทคนิคอินดิเคเตอร์ (เช่น RSI, MACD, Moving Average ปัจจุบันของสินค้าแต่ละประเภท เช่น ทองคำ หรือ Bitcoin) ร่วมกับข้อมูลพอร์ต
      เพื่อประเมินแนวโน้มตลาดออกมาเป็นสัญลักษณ์ละหนึ่งค่าคือ "BUY", "SELL", หรือ "FLAT" เท่านั้น 
      
      ให้ประมวลผลลัพธ์ตอบกลับมาในรูปแบบ JSON วัตถุตรงๆ ห้ามอธิบายใดๆ นอกโครงสร้างนี้:
      {
        "trends": {
          "XAUUSD": "BUY",
          "BTCUSD": "SELL",
          "EURUSD": "FLAT"
        }
      }
      *(ให้ตรวจสอบสัญลักษณ์ตามที่ส่งไปในชุดข้อมูลจริง หากหน้าบ้านเพิ่มตัวไหนเข้ามา ให้เพิ่มตัวนั้นเข้าใน object trends ด้วย)*
    `;

    const response = await ai.models.generateContent({
      model: ai_model || 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        systemInstruction: systemInstruction,
        temperature: 0.2
      },
      contents: `จงวิเคราะห์สัญลักษณ์เหล่านี้ตามข้อมูลอินดิเคเตอร์ล่าสุดปัจจุบัน: ${JSON.stringify(symbols_to_analyze)}`
    });

    return res.status(200).json(JSON.parse(response.text));

  } catch (error) {
    return res.status(500).json({ error: 'AI Screener Failed' });
  }
}
