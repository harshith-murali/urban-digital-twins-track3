import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  const { mode, zone, load } = await req.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  const prompts = {
    traffic: `Traffic congestion at ${zone}: ${load}%. Give 3 short actionable steps. Be concise.`,
    energy: `Power station ${zone} at ${load}% capacity. Give 3 load balancing steps. Be concise.`,
    water: `Water pressure at ${zone} dropped to ${load}%. Give 3 emergency response steps. Be concise.`,
    disaster: `Flood alert at ${zone}, severity ${load}%. Give 3 immediate evacuation steps. Be concise.`,
  };

  const result = await model.generateContentStream(
    prompts[mode] || prompts.traffic,
  );

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    for await (const chunk of result.stream) {
      await writer.write(encoder.encode(chunk.text()));
    }
    writer.close();
  })();

  return new Response(stream.readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
