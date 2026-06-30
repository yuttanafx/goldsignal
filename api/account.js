// api/account.js
// EA push สถานะบัญชี/positions เข้ามาที่นี่ (POST) ทุก 5-10 วินาที
// หน้าเว็บ (dashboard) อ่านสถานะล่าสุดออกไป (GET)

import { kv } from '@vercel/kv';

const ACCOUNT_KEY = 'account:latest';
const API_KEY = process.env.EA_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const data = await kv.get(ACCOUNT_KEY);
    return res.status(200).json(data || { account: null, positions: [] });
  }

  if (req.method === 'POST') {
    const key = req.headers['x-api-key'];
    if (API_KEY && key !== API_KEY) return res.status(401).json({ error: 'invalid api key' });

    const { account, positions } = req.body || {};
    if (!account) return res.status(400).json({ error: 'account ข้อมูลจำเป็นต้องระบุ' });

    await kv.set(ACCOUNT_KEY, { account, positions: positions || [], updatedAt: Date.now() });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
