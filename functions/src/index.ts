import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { fetch } from "undici";
import { ADMIN_CREDENTIALS } from "./auth";
import cors from "cors"; 
import express from "express";



admin.initializeApp();
const db = admin.firestore();

// ✅ express 앱 생성 + cors 허용
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/", (req, res) => {
  console.log("[🔐] 로그인 시도");
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.status(200).send({ message: '로그인 성공' });
  } else {
    res.status(401).send({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
  }
});

export const login = functions.https.onRequest(app);


// 디스코드 알림
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
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
    console.error("❌ DISCORD_WEBHOOK_URL not set.");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  console.log(`[📡] Discord 응답 코드: ${response.status}`);
  const text = await response.text();
  console.log(`[📡] Discord 응답 내용: ${text}`);
}

// 유통기한 알림
export const dailyExpiryCheck = functions.pubsub.schedule("every day 09:00")
  .timeZone("Australia/Perth")
  .onRun(async () => {
    const snapshot = await db.collection("products").get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const dday = getDdayLabel(data.date);
      if (dday) {
        const message = `📦 [${dday}] *${data.name}* 유통기한 임박! (${data.date})\n수량: ${data.quantity ?? '정보 없음'} / 바코드: ${data.barcode ?? '없음'}`;
        await sendDiscordMessage(message);
      }
    }

    console.log(`[✅] 디스코드 알림 완료: ${new Date().toLocaleString()}`);
  });

  
// 강제로 login 함수 참조해서 빌드 시 포함시키기
console.log("[Export 확인] login 함수 준비됨:", typeof login);
