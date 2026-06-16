import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required but was not found.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// AI writing evaluation route
app.post('/api/grade-writing', async (req, res) => {
  try {
    const { question, correctAnswer, userAnswer } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({
        error: 'Thiếu thông tin câu hỏi hoặc đáp án gốc mẫu.',
      });
    }

    const trimmedUserAnswer = (userAnswer || '').trim();

    // If answer is empty, handle immediately without wasting AI tokens
    if (!trimmedUserAnswer) {
      return res.json({
        score: 0,
        feedback: 'Bạn chưa nhập câu trả lời. Hãy cố gắng ghi nhớ và gõ câu trả lời của mình nhé.',
        missingPoints: ['Toàn bộ nội dung đáp án gốc'],
      });
    }

    try {
      const ai = getGeminiClient();

      const prompt = `
Hãy chấm điểm bài làm của học viên so với đáp án gốc Công giáo:
- Câu hỏi: "${question}"
- Đáp án gốc mẫu: "${correctAnswer}"
- Bài làm của học sinh: "${trimmedUserAnswer}"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: `Bạn là một "Giám khảo chấm thi Giáo lý" nghiêm khắc, công tâm nhưng thấu hiểu sâu sắc nội dung và tinh thần Giáo lý Hội Thánh Công Giáo.
Nhiệm vụ của bạn là đánh giá bài làm tự luận của học viên so với đáp án gốc mẫu của câu hỏi được cung cấp.

Quy tắc chấm điểm:
1. Hãy đánh giá chấm điểm từ 0 đến 100 dựa trên mức độ tương đồng ý nghĩa chính, nội dung thần học và thần khí của đáp án gốc, không cứng nhắc so khớp từng từ ngữ.
2. Học viên có thể diễn đạt bằng lời lẽ riêng của họ (ví dụ: chấp nhận từ đồng nghĩa hoặc tương đồng từ như "tạo dựng" - "dựng nên", "Đức Kitô" - "Đức Giêsu" - "Chúa Giêsu", "Thánh Thể" - "Bí tích Mình và Máu Thánh Chúa", "bổn phận" - "trách nhiệm",... hoặc sắp xếp thứ tự ý khác nhau). Khuyến khích sự hiểu biết hơn là học vẹt từng chữ.
3. Chấm lỏng tay về lỗi gõ phím, lỗi chính tả nhẹ (ví dụ thiếu ký tự, viết tắt thông thường tắt "Chúa" thành "Ch", "Giáo lý" thành "GL"...), lỗi ngữ pháp hoặc thiếu từ liên kết, nhưng cần chặt chẽ về mặt đủ các "Ý chính thần học" cốt lõi.
4. Trả về định dạng JSON gồm các trường:
   - score: Điểm số kiểu số nguyên (0-100).
   - feedback: Lời nhận xét nhận định chi tiết bằng tiếng Việt nhã nhặn, đầy tính khích lệ Giáo lý viên/Học viên, chỉ ra điểm đúng, điểm hay và cách diễn tả ý sao cho tốt hơn.
   - missingPoints: Mảng các chuỗi liệt kê các ý chính/điểm mấu chốt quan trọng mà học viên ĐÃ BỎ SÓT hoặc CHƯA NÊU ĐỦ trong bài làm so với đáp án gốc. Nếu bài làm đã đầy đủ ý hoặc hoàn hảo, hãy trả về mảng rỗng [].`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: 'Điểm số từ 0 đến 100 dựa trên mức độ chính xác về ý nghĩa.',
              },
              feedback: {
                type: Type.STRING,
                description: 'Nhận xét chi tiết, nhã nhặn bằng tiếng Việt.',
              },
              missingPoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: 'Danh sách các ý chính nổi bật bị thiếu trong câu trả lời.',
              },
            },
            required: ['score', 'feedback', 'missingPoints'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini API returned an empty output');
      }

      const parsedResult = JSON.parse(text);
      return res.json(parsedResult);

    } catch (aiError: any) {
      console.error('Error invoking or parsing Gemini API:', aiError);
      
      // Fallback to local keyword-based result representation if API fails, in rich format
      return res.status(500).json({
        error: 'Có lỗi xảy ra khi chấm điểm bằng AI. Bạn có thể đối chiếu trực tiếp với đáp án gốc ở dưới.',
        score: null,
        feedback: 'Không thể kết nối với Giám khảo AI lúc này. Vui lòng thử lại sau hoặc sử dụng chấm điểm tự chọn.',
        missingPoints: []
      });
    }

  } catch (error: any) {
    console.error('General route error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Setup development server or production static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in DEVELOPMENT mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
  } else {
    console.log('Running in PRODUCTION mode. Serving pre-compiled static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom server running successfully on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap the Express+Vite application:', err);
  process.exit(1);
});
