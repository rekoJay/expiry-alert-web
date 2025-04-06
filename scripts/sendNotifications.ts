// sendNotifications.ts

import dotenv from 'dotenv';
import nodeFetch from 'node-fetch';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json'; // 🔥 서비스 계정 경로 정확히 입력

dotenv.config();

const fetch = (nodeFetch as any) as typeof nodeFetch;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = getFirestore();

const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;
const TARGET_DAYS = [30, 14, 7, 3, 1];

function getDdayLabel(dateStr: string): string | null {
  const today = new Date();
  const expiry = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return TARGET_DAYS.includes(diff) ? `D-${diff}` : null;
}

async function sendDiscordMessage(content: string) {
  if (!webhookUrl) {
    console.error('❌ DISCORD_WEBHOOK_URL이 .env에 설정되지 않았습니다.');
    return;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

async function notifyExpiringProducts() {
  const snapshot = await db.collection('products').get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const dday = getDdayLabel(data.date);
    if (dday) {
      const message = `📦 [${dday}] *${data.name}* 유통기한 임박! (${data.date})\n수량: ${data.quantity ?? '정보 없음'} / 바코드: ${data.barcode ?? '없음'}`;
      await sendDiscordMessage(message);
    }
  }

  console.log(`[✅] 알림 완료: ${new Date().toLocaleString()}`);
}

notifyExpiringProducts();
