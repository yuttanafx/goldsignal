// api/strategies.js
// EA คำนวณคะแนนแต่ละกลยุทธ์แล้ว POST เข้ามาเก็บที่นี่ทุก ๆ N วินาที
// Dashboard อ่านออกไปแสดงเป็นการ์ด Strategy Intelligence

import { kv } from '@vercel/kv';

const KEY = 'strategies:latest';
const API_KEY = process.env.EA_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const data = await kv.get(KEY);
    return res.status(200).json(data || { strategies: [], updatedAt: null });
  }

  if (req.method === 'POST') {
    const key = req.headers['x-api-key'];
    if (API_KEY && key !== API_KEY) return res.status(401).json({ error: 'invalid api key' });

    const { strategies } = req.body || {};
    if (!Array.isArray(strategies)) {
      return res.status(400).json({ error: 'strategies ต้องเป็น array' });
    }
    await kv.set(KEY, { strategies, updatedAt: Date.now() });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
