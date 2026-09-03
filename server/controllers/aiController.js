const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const chatWithAI = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung tin nhắn",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing");

      return res.status(500).json({
        success: false,
        message: "AI service chưa được cấu hình",
      });
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý mua sắm của Vouges. Hãy trả lời rõ ràng, lịch sự và bằng tiếng Việt.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.2,
        max_completion_tokens: 500,
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error(
        "Groq API error:",
        groqResponse.status,
        data?.error?.message,
      );

      return res.status(groqResponse.status === 429 ? 429 : 502).json({
        success: false,
        message:
          groqResponse.status === 429
            ? "Đã vượt giới hạn sử dụng AI miễn phí"
            : "Không thể kết nối dịch vụ AI",
      });
    }

    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(502).json({
        success: false,
        message: "AI không trả về nội dung",
      });
    }

    return res.status(200).json({
      success: true,
      message: answer,
    });
  } catch (error) {
    console.error("AI controller error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý yêu cầu AI",
    });
  }
};
