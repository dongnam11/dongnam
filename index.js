require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const userModes = {}; // { userId: "kaiwa" / "dich" }

app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  for (let event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      await handleMessage(userId, userMessage, replyToken);
    }
  }
  res.sendStatus(200);
});

async function handleMessage(userId, userMessage, replyToken) {
  if (userMessage === "/kaiwa") {
    userModes[userId] = "kaiwa";
    await replyUser(replyToken, "✅ Đã chuyển sang chế độ 会話 (Kaiwa - luyện hội thoại).");
    return;
  }
  if (userMessage === "/dịch") {
    userModes[userId] = "dich";
    await replyUser(replyToken, "✅ Đã chuyển sang chế độ 翻訳 (Dịch thuật).");
    return;
  }

  const mode = userModes[userId] || "kaiwa";
  if (mode === "kaiwa") {
    const replyText = await chatWithKaiwa(userMessage);
    await replyUser(replyToken, replyText);
  } else {
    const replyText = await translateToJapanese(userMessage);
    await replyUser(replyToken, replyText);
  }
}

async function chatWithKaiwa(text) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4",
    messages: [
      { role: "system", content: "Bạn là người bạn Nhật Bản, hãy trả lời hội thoại tiếng Nhật tự nhiên." },
      { role: "user", content: text }
    ]
  }, {
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
  });
  return response.data.choices[0].message.content.trim();
}

async function translateToJapanese(text) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4",
    messages: [
      { role: "system", content: "Dịch câu sau từ tiếng Việt sang tiếng Nhật." },
      { role: "user", content: text }
    ]
  }, {
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
  });
  return response.data.choices[0].message.content.trim();
}

async function replyUser(replyToken, message) {
  await axios.post('https://api.line.me/v2/bot/message/reply', {
    replyToken,
    messages: [{ type: 'text', text: message }]
  }, {
    headers: {
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server chatbot kaiwa đang chạy ở cổng ${port}`);
});
async function handleMessage(userId, userMessage, replyToken) {
  if (userMessage === "/kaiwa") {
    userModes[userId] = "kaiwa";
    await replyUser(replyToken, "✅ Đã chuyển sang chế độ 会話 (Kaiwa - luyện hội thoại).");
    return;
  }
  if (userMessage === "/dịch") {
    userModes[userId] = "dich";
    await replyUser(replyToken, "✅ Đã chuyển sang chế độ 翻訳 (Dịch thuật tiếng Việt sang tiếng Nhật).");
    return;
  }

  const mode = userModes[userId] || "kaiwa"; // Mặc định là hội thoại

  let replyText = "";

  if (mode === "kaiwa") {
    replyText = await chatWithKaiwa(userMessage); // Gọi AI trả lời hội thoại
  } else if (mode === "dich") {
    replyText = await translateToJapanese(userMessage); // Gọi AI dịch
  }

  await replyUser(replyToken, replyText);
}
async function chatWithKaiwa(text) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4", // hoặc "gpt-3.5-turbo" nếu muốn tiết kiệm chi phí
    messages: [
      { role: "system", content: "Bạn là người bạn Nhật Bản, trả lời tự nhiên bằng tiếng Nhật khi luyện hội thoại." },
      { role: "user", content: text }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content.trim();
}
async function translateToJapanese(text) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4",
    messages: [
      { role: "system", content: "Dịch câu sau từ tiếng Việt sang tiếng Nhật. Hãy dịch tự nhiên và lịch sự." },
      { role: "user", content: text }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content.trim();
}
