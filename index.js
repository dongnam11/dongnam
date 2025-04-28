require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // 🔥 Dùng OpenRouter Key

const userModes = {}; // { userId: "kaiwa" hoặc "dich" }

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
    await replyUser(replyToken, "✅ Đã chuyển sang chế độ 翻訳 (Dịch tiếng Việt → tiếng Nhật).");
    return;
  }

  const mode = userModes[userId] || "kaiwa";
  let replyText = "";

  try {
    if (mode === "kaiwa") {
      replyText = await chatWithKaiwa(userMessage);
    } else if (mode === "dich") {
      replyText = await translateToJapanese(userMessage);
    }

    await replyUser(replyToken, replyText);
  } catch (error) {
    console.error("❌ Lỗi khi xử lý:", error.message);
    await replyUser(replyToken, "⚠️ Xin lỗi, bot gặp lỗi. Vui lòng thử lại sau.");
  }
}

async function chatWithKaiwa(text) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: "anthropic/claude-3-haiku-20240307", // 🔥 Model miễn phí, rất giỏi tiếng Nhật
    messages: [
      { role: "user", content: text }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content.trim();
}

async function translateToJapanese(text) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: "anthropic/claude-3-haiku-20240307",
    messages: [
      { role: "system", content: "Dịch nội dung người dùng nhập từ tiếng Việt sang tiếng Nhật. Dùng ngôn ngữ tự nhiên và lịch sự." },
      { role: "user", content: text }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content.trim();
}

async function replyUser(replyToken, message) {
  await axios.post('https://api.line.me/v2/bot/message/reply', {
    replyToken: replyToken,
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
