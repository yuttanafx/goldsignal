// api/orders.js
// ใช้ Vercel KV (Upstash Redis) เก็บคิวคำสั่งกลาง — เพราะ serverless function
// ไม่มี memory ถาวร ต้องใช้ฐานข้อมูลภายนอกที่ EA และเว็บอ่าน/เขียนร่วมกันได้
//
// ติดตั้ง: ใน Vercel dashboard -> Storage -> Create Database -> KV (Upstash)
// แล้ว `npm i @vercel/kv` จะถูกตั้งค่า ENV ให้อัตโนมัติ

import { kv } from '@vercel/kv';

const QUEUE_KEY = 'orders:queue';
const API_KEY = process.env.EA_API_KEY; // ตั้งใน Vercel env, ต้องตรงกับ ApiKey ใน EA

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // EA และหน้าเว็บใช้ endpoint นี้ดึงคิวที่ยัง pending
    const orders = (await kv.get(QUEUE_KEY)) || [];
    return res.status(200).json({ orders });
  }

  if (req.method === 'POST') {
    const { side, symbol, lot, sl, tp, strategy } = req.body || {};
    if (!side || !symbol || !lot) {
      return res.status(400).json({ error: 'side, symbol, lot จำเป็นต้องระบุ' });
    }
    const order = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      side: String(side).toUpperCase(),
      symbol,
      lot: Number(lot),
      sl: sl ?? null,
      tp: tp ?? null,
      strategy: strategy || '',
      status: 'pending', // pending -> sent -> filled / failed (EA จะอัปเดต)
      createdAt: Date.now(),
    };
    const orders = (await kv.get(QUEUE_KEY)) || [];
    orders.push(order);
    await kv.set(QUEUE_KEY, orders);
    return res.status(200).json({ ok: true, order });
  }

  if (req.method === 'PATCH') {
    // EA เรียกหลังเปิดออเดอร์สำเร็จ เพื่ออัปเดตสถานะ + ticket จริง
    const key = req.headers['x-api-key'];
    if (API_KEY && key !== API_KEY) return res.status(401).json({ error: 'invalid api key' });

    const { id, status, ticket, error } = req.body || {};
    const orders = (await kv.get(QUEUE_KEY)) || [];
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: 'order not found' });
    orders[idx].status = status || orders[idx].status;
    if (ticket) orders[idx].ticket = ticket;
    if (error) orders[idx].error = error;
    await kv.set(QUEUE_KEY, orders);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
