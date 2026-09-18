import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { text, currentDate, categories } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp văn bản giọng nói' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Try Gemini API if key is configured
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const categoryContext = categories && categories.length > 0
          ? JSON.stringify(categories.map((c: any) => ({ id: c.id, name: c.name, type: c.type })))
          : '[]';

        const prompt = `
Bạn là một trợ lý tài chính thông minh tiếng Việt. Hãy phân tích câu thoại thu nhập/chi tiêu sau đây của người dùng:
"${text}"

Bối cảnh thời gian hiện tại của hệ thống: ${currentDate || new Date().toISOString()}

Danh sách danh mục có sẵn của người dùng:
${categoryContext}

NHIỆM VỤ CỦA BẠN:
1. Xác định số tiền (amount): Trích xuất con số tiền tệ chính xác theo VND.
   - 25k -> 25000
   - 500k / 500 ngàn -> 500000
   - 1.5 triệu / 1.5 củ -> 1500000
   - 15 củ -> 15000000
2. Phân loại type: 'expense' (chi tiêu/trả tiền/mua) hoặc 'income' (lương/thưởng/nhận tiền/được cho).
3. Khớp category_id & category_name: Chọn danh mục phù hợp nhất từ danh sách danh mục có sẵn trên. Nếu không tìm thấy category trùng khớp tuyệt đối, hãy chọn category có tên gần nhất hoặc danh mục "Khác".
4. Trích xuất description: Tóm tắt nội dung giao dịch ngắn gọn (vd: "Đi ăn cơm tấm", "Trả tiền điện", "Nhận lương tháng 9").
5. Giải mã transaction_date: Chuyển đổi các cụm từ thời gian tương đối như "hôm qua", "thứ 2 tuần trước", "hôm kia", "sáng nay", "tối qua" thành chuỗi ngày định dạng YYYY-MM-DD dựa vào thời gian hiện tại. Nếu không đề cập thời gian, sử dụng ngày hiện tại.

Trả về duy nhất dữ liệu JSON với cấu trúc chính xác sau:
{
  "amount": 500000,
  "type": "expense",
  "category_id": "string-uuid-id",
  "category_name": "Tên danh mục",
  "description": "Nội dung giao dịch ngắn",
  "transaction_date": "YYYY-MM-DD"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsedData = JSON.parse(responseText);

        return NextResponse.json(parsedData);
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to regex parser:', geminiError);
      }
    }

    // Fallback rule-based parser if Gemini Key is missing or API failed
    const parsedFallback = mockVietnameseParser(text, currentDate, categories);
    return NextResponse.json(parsedFallback);

  } catch (error: any) {
    console.error('Error parsing voice input:', error);
    return NextResponse.json(
      { error: 'Không thể phân tích giọng nói: ' + (error.message || error) },
      { status: 500 }
    );
  }
}

// Simple rule-based parser when Gemini API Key is missing or fails
function mockVietnameseParser(text: string, currentDate: string, categories: any[]) {
  const lower = text.toLowerCase();
  
  // Extract amount
  let amount = 0;
  const kMatch = lower.match(/(\d+[\.,]?\d*)\s*(k|ngàn|ngan|nghìn|nghin)/);
  const cuMatch = lower.match(/(\d+[\.,]?\d*)\s*(củ|cu|triệu|trieu|tr)/);
  const plainMatch = lower.match(/(\d{4,10})/);

  if (kMatch) {
    amount = parseFloat(kMatch[1].replace(',', '.')) * 1000;
  } else if (cuMatch) {
    amount = parseFloat(cuMatch[1].replace(',', '.')) * 1000000;
  } else if (plainMatch) {
    amount = parseInt(plainMatch[1], 10);
  } else {
    amount = 50000;
  }

  // Type
  const isIncome = lower.includes('lương') || lower.includes('thưởng') || lower.includes('nhận') || lower.includes('thu');
  const type = isIncome ? 'income' : 'expense';

  // Relative Date
  let dateObj = currentDate ? new Date(currentDate) : new Date();
  if (lower.includes('hôm qua') || lower.includes('hom qua')) {
    dateObj.setDate(dateObj.getDate() - 1);
  } else if (lower.includes('hôm kia') || lower.includes('hom kia')) {
    dateObj.setDate(dateObj.getDate() - 2);
  }
  const transaction_date = dateObj.toISOString().split('T')[0];

  // Category matching
  let matchedCat = categories?.find((c) => {
    const cName = c.name.toLowerCase();
    return lower.includes(cName) || cName.includes(lower);
  });

  if (!matchedCat && categories && categories.length > 0) {
    matchedCat = categories.find((c) => c.type === type) || categories[0];
  }

  return {
    amount,
    type,
    category_id: matchedCat?.id || 'cat-c-food',
    category_name: matchedCat?.name || 'Ăn uống',
    description: text.replace(/\d+\s*(k|củ|tr|triệu|ngàn)?/gi, '').trim() || text,
    transaction_date,
  };
}
