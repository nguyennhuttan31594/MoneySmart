import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Keyword mapping dictionary for 8 standard categories
const CATEGORY_MAPPING_RULES: { [key: string]: string[] } = {
  'Ăn uống': ['ăn uống', 'an uong', 'ăn', 'uống', 'phở', 'cơm', 'bún', 'bánh', 'trà sữa', 'cà phê', 'cafe', 'ăn sáng', 'ăn trưa', 'ăn tối', 'nhà hàng', 'quán ăn', 'đi chợ', 'siêu thị', 'thức ăn', 'nước uống', 'nhậu', 'bia'],
  'Di chuyển': ['di chuyển', 'di chuyen', 'xăng', 'xăng xe', 'xe cộ', 'grab', 'gojek', 'be', 'gửi xe', 'sửa xe', 'vé xe', 'vé máy bay', 'taxi', 'đi lại', 'ô tô', 'xe máy', 'bãi xe', 'xe'],
  'Hóa đơn & Điện nước': ['hóa đơn', 'hoa don', 'tiền điện', 'tiền nước', 'điện', 'nước', 'internet', 'wifi', 'điện thoại', 'nạp tiền', 'nạp thẻ', 'truyền hình', 'phí chung cư', 'rác', 'tiền phòng', 'tiền nhà', 'thuê nhà', 'nhà ở'],
  'Mua sắm/Giải trí': ['mua sắm', 'mua sam', 'giải trí', 'giai tri', 'du lịch', 'quần áo', 'giày dép', 'đồ dùng', 'mỹ phẩm', 'tiki', 'shopee', 'lazada', 'tiktok shop', 'phụ kiện', 'túi xách', 'đồng hồ', 'xem phim', 'chơi game', 'game', 'vé xem phim', 'karaoke'],
  'Sức khỏe': ['sức khỏe', 'suc khoe', 'y tế', 'y te', 'thuốc', 'tiền thuốc', 'nhà thuốc', 'khám bệnh', 'bệnh viện', 'nha khoa', 'bảo hiểm y tế', 'bác sĩ', 'thuốc tây'],
  'Con cái': ['con cái', 'con cai', 'tiền học', 'học phí', 'học tập', 'bỉm', 'sữa', 'đồ chơi', 'trường học', 'gia sư', 'tiền con', 'sách'],
  'Trả nợ': ['trả nợ', 'tra no', 'vay nợ', 'vay no', 'mượn tiền', 'trả góp', 'ngân hàng', 'cho vay', 'đòi nợ', 'tín dụng', 'lãi suất'],
  'Thu nhập': ['thu nhập', 'thu nhap', 'lương', 'luong', 'thưởng', 'thuong', 'lì xì', 'đầu tư', 'chứng khoán', 'bất động sản', 'lãi', 'tiền lương', 'nhận tiền', 'thu'],
};

export async function POST(req: NextRequest) {
  try {
    const { text, currentDate, categories } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp văn bản giọng nói' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let rawResult: any = null;

    // Try Gemini API if key is configured
    if (apiKey) {
      try {
        console.log('Gemini API Key detected. Calling Gemini API gemini-1.5-flash...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = `
Bạn là một trợ lý tài chính thông minh tiếng Việt. Hãy phân tích câu thoại thu nhập/chi tiêu sau đây của người dùng:
"${text}"

Bối cảnh thời gian hiện tại của hệ thống: ${currentDate || new Date().toISOString()}

NHIỆM VỤ CỦA BẠN:
1. Xác định số tiền (amount): Trích xuất con số tiền tệ chính xác theo đơn vị VND.
   - Các số tự nhiên đơn lẻ/ngắn như 300, 50, 100, 35, 500 khi đứng trong ngữ cảnh chi tiêu đều HIỂU NGẦM tương ứng với đơn vị NGHÌN ĐỒNG (x 1.000):
     + 300 -> 300000
     + 50 -> 50000
     + 100 -> 100000
     + 35 -> 35000
     + 500 -> 500000
   - Các định dạng viết tắt khác:
     + 25k / 25 ngàn -> 25000
     + 500k / 500 nghìn -> 500000
     + 1.5 triệu / 1.5 củ / 1.5tr -> 1500000
     + 15 củ -> 15000000
   - Số nguyên lớn >= 1000 (vd: 50000, 200000, 1500000) giữ nguyên giá trị VND.

2. Phân loại type: 'expense' (chi tiêu/trả tiền/mua) hoặc 'income' (lương/thưởng/nhận tiền/được cho).

3. BẮT BUỘC ÉP DANH MỤC (category_name) THUỘC ĐÚNG 1 TRONG 8 CHUỖI TÊN CỐ ĐỊNH SAU (ENUM):
   - Nếu type là 'expense' (Chi tiêu), CHỈ ĐƯỢC CHỌN 1 TRONG 7 TÊN SAU:
     1. "Ăn uống"
     2. "Di chuyển"
     3. "Hóa đơn & Điện nước"
     4. "Mua sắm/Giải trí"
     5. "Sức khỏe"
     6. "Con cái"
     7. "Trả nợ"
   - Nếu type là 'income' (Thu nhập), CHỈ ĐƯỢC CHỌN CHÍNH XÁC TÊN SAU:
     1. "Thu nhập"

4. Trích xuất description: Tóm tắt nội dung giao dịch ngắn gọn (vd: "Đi ăn cơm tấm", "Trả tiền điện", "Nhận lương tháng 9").
5. Giải mã transaction_date: Chuyển đổi các cụm từ thời gian tương đối như "hôm qua", "thứ 2 tuần trước", "hôm kia", "sáng nay", "tối qua" thành chuỗi ngày định dạng YYYY-MM-DD dựa vào thời gian hiện tại. Nếu không đề cập thời gian, sử dụng ngày hiện tại.

Trả về duy nhất dữ liệu JSON với cấu trúc chính xác sau:
{
  "amount": 300000,
  "type": "expense",
  "category_name": "Ăn uống",
  "description": "Nội dung giao dịch ngắn",
  "transaction_date": "YYYY-MM-DD"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        rawResult = JSON.parse(responseText);
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to regex parser:', geminiError);
      }
    } else {
      console.warn('GEMINI_API_KEY is missing in process.env. Using fallback regex parser.');
    }

    // Fallback rule-based parser if Gemini Key is missing or API failed
    if (!rawResult) {
      rawResult = mockVietnameseParser(text, currentDate);
    }

    // Normalize category mapping against Frontend category list
    const finalParsedData = normalizeCategoryResult(rawResult, text, categories);
    return NextResponse.json(finalParsedData);

  } catch (error: any) {
    console.error('Error parsing voice input:', error);
    return NextResponse.json(
      { error: 'Không thể phân tích giọng nói: ' + (error.message || error) },
      { status: 500 }
    );
  }
}

// Normalize and map category name & id to exact 8 standard categories
function normalizeCategoryResult(raw: any, rawText: string, categories: any[]) {
  const type = raw?.type === 'income' ? 'income' : 'expense';
  const textLower = rawText.toLowerCase();
  const catInputLower = (raw?.category_name || raw?.category_id || '').toLowerCase();

  // Find candidate categories for this type (only children categories)
  const availableCats = categories && categories.length > 0
    ? categories.filter((c: any) => c.type === type && c.parent_id !== null)
    : [];

  let matchedCat: any = null;

  // 1. Exact match by category name or category id
  if (catInputLower) {
    matchedCat = availableCats.find(
      (c: any) =>
        c.name.toLowerCase() === catInputLower ||
        c.id.toLowerCase() === catInputLower
    );
  }

  // 2. Keyword Mapping Dictionary Match
  if (!matchedCat) {
    for (const [standardName, keywords] of Object.entries(CATEGORY_MAPPING_RULES)) {
      const matchKeyword = keywords.some(
        (kw) => catInputLower.includes(kw) || textLower.includes(kw)
      );
      if (matchKeyword) {
        matchedCat = availableCats.find(
          (c: any) => c.name.toLowerCase() === standardName.toLowerCase()
        );
        if (matchedCat) break;
      }
    }
  }

  // 3. Substring match
  if (!matchedCat && catInputLower) {
    matchedCat = availableCats.find(
      (c: any) =>
        c.name.toLowerCase().includes(catInputLower) ||
        catInputLower.includes(c.name.toLowerCase())
    );
  }

  // 4. Default fallback category if no match
  if (!matchedCat) {
    matchedCat = availableCats.find((c: any) => c.type === type) || {
      id: type === 'income' ? 'cat-c-income' : 'cat-c-food',
      name: type === 'income' ? 'Thu nhập' : 'Ăn uống',
    };
  }

  // Amount parsing safety
  let amount = typeof raw?.amount === 'number' && !isNaN(raw.amount) ? raw.amount : 0;
  if (amount < 1000 && amount > 0) {
    amount = amount * 1000;
  }

  return {
    amount,
    type,
    category_id: matchedCat.id,
    category_name: matchedCat.name,
    description: raw?.description || rawText,
    transaction_date: raw?.transaction_date || new Date().toISOString().split('T')[0],
  };
}

// Improved rule-based parser when Gemini API Key is missing or fails
function mockVietnameseParser(text: string, currentDate: string) {
  const lower = text.toLowerCase();

  // Extract amount
  let amount = 0;
  const kMatch = lower.match(/(\d+[\.,]?\d*)\s*(k|ngàn|ngan|nghìn|nghin)/);
  const cuMatch = lower.match(/(\d+[\.,]?\d*)\s*(củ|cu|triệu|trieu|tr)/);
  const numberMatches = lower.match(/(\d+[\.,]?\d*)/g);

  if (kMatch) {
    amount = parseFloat(kMatch[1].replace(',', '.')) * 1000;
  } else if (cuMatch) {
    amount = parseFloat(cuMatch[1].replace(',', '.')) * 1000000;
  } else if (numberMatches && numberMatches.length > 0) {
    const rawVal = parseFloat(numberMatches[numberMatches.length - 1].replace(',', '.'));
    if (!isNaN(rawVal)) {
      if (rawVal < 1000) {
        amount = rawVal * 1000;
      } else {
        amount = rawVal;
      }
    }
  }

  // Type
  const isIncome = lower.includes('lương') || lower.includes('luong') || lower.includes('thưởng') || lower.includes('thuong') || lower.includes('nhận') || lower.includes('nhan') || lower.includes('thu');
  const type = isIncome ? 'income' : 'expense';

  // Relative Date
  let dateObj = currentDate ? new Date(currentDate) : new Date();
  if (lower.includes('hôm qua') || lower.includes('hom qua')) {
    dateObj.setDate(dateObj.getDate() - 1);
  } else if (lower.includes('hôm kia') || lower.includes('hom kia')) {
    dateObj.setDate(dateObj.getDate() - 2);
  }
  const transaction_date = dateObj.toISOString().split('T')[0];

  // Description cleanup
  const cleanDesc = text
    .replace(/\d+[\.,]?\d*\s*(k|củ|cu|tr|triệu|trieu|ngàn|ngan|nghìn|nghin)?/gi, '')
    .trim();

  return {
    amount,
    type,
    description: cleanDesc || text,
    transaction_date,
  };
}
