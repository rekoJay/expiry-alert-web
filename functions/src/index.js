"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyExpiryCheck = exports.login = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const undici_1 = require("undici");
const auth_1 = require("./auth");
admin.initializeApp();
const db = admin.firestore();
exports.login = functions.https.onRequest((req, res) => {
    console.log("[🔐] 로그인 시도");
    const { username, password } = req.body;
    if (username === auth_1.ADMIN_CREDENTIALS.username && password === auth_1.ADMIN_CREDENTIALS.password) {
        res.status(200).send({ message: '로그인 성공' });
    }
    else {
        res.status(401).send({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }
});
// 디스코드 알림
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const TARGET_DAYS = [30, 14, 7, 3, 1];
function getDdayLabel(dateStr) {
    const today = new Date();
    const expiry = new Date(dateStr);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return TARGET_DAYS.includes(diff) ? `D-${diff}` : null;
}
async function sendDiscordMessage(content) {
    if (!webhookUrl) {
        console.error("❌ DISCORD_WEBHOOK_URL not set.");
        return;
    }
    const response = await (0, undici_1.fetch)(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    console.log(`[📡] Discord 응답 코드: ${response.status}`);
    const text = await response.text();
    console.log(`[📡] Discord 응답 내용: ${text}`);
}
// 유통기한 알림
exports.dailyExpiryCheck = functions.pubsub.schedule("every day 09:00")
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
console.log("[Export 확인] login 함수 준비됨:", typeof exports.login);
