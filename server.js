
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const ai = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

app.post("/api/generate-exam", async (req, res) => {
  try {
    const {
      grade,
      subject,
      lesson,
      count,
      difficulty,
      duration,
      type
    } = req.body;

    if (!grade || !subject || !count) {
      return res.status(400).json({
        error: "اطلاعات آزمون کامل نیست."
      });
    }

    const prompt = `
تو یک طراح آزمون تخصصی رشته علوم انسانی ایران هستی.

سال تحصیلی: ۱۴۰۵-۱۴۰۶
پایه: ${grade}
درس: ${subject}
مبحث: ${lesson || "تمام مباحث"}
تعداد سؤال: ${count}
سطح دشواری: ${difficulty || "متوسط"}
مدت آزمون: ${duration || 30} دقیقه
نوع آزمون: ${type || "تستی"}

قوانین:
- فقط از محتوای معتبر و منطبق با کتاب درسی سؤال بساز.
- مطلب خارج از کتاب اضافه نکن.
- سؤال تکراری نساز.
- پاسخ صحیح و توضیح آموزشی ارائه کن.
- اگر متن معتبر کتاب در دسترس نیست، محتوای ساختگی تولید نکن و اعلام کن.

خروجی فقط JSON معتبر با این ساختار باشد:
{
  "title": "عنوان آزمون",
  "questions": [
    {
      "question": "متن سؤال",
      "options": ["گزینه ۱","گزینه ۲","گزینه ۳","گزینه ۴"],
      "answer": 0,
      "explanation": "توضیح پاسخ",
      "difficulty": "متوسط"
    }
  ]
}
`;

    const result = await ai.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 6000,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const output = result.content
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("");

    const clean = output
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    res.json(JSON.parse(clean));

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "ساخت آزمون ناموفق بود."
    });
  }
});

app.get("/", (req, res) => {
  res.send("Fonon AI Server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Fonon server running on port " + PORT);
});
