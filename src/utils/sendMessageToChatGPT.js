const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const sendMessageToChatGPT = async (message) => {
  if (!API_KEY) {
    console.error("Missing OpenAI API key. Check your .env.");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // or "gpt-4-turbo"
        messages: [
          { role: "system", content: "You are an expert business plan evaluator." },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return null;
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("Network error:", err);
    return null;
  }
};
