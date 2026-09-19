import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rich Vietnamese semantic keyword dictionary with exact word-boundary safety
const CATEGORY_MAPPING_RULES: { [key: string]: string[] } = {
  'Di chuyển': [
    'xăng', 'xang', 'đổ xăng', 'do xang', 'xăng xe', 'gửi xe', 'gui xe', 'bãi xe', 'bai xe',
    'rửa xe', 'rua xe', 'sửa xe', 'sua xe', 'bảo dưỡng xe', 'thay nhớt', 'nhớt xe', 'thay lốp',
    'grab', 'gojek', 'be', 'taxi', 'xe ôm', 'xe om', 'vé xe', 've xe', 'vé máy bay', 've may bay',
    'phí cầu đường', 'phí cao tốc', 'vé trạm', 'vétram', 'ô tô', 'o to', 'xe máy', 'xe may',
    'đường bộ', 'bảo hiểm xe', 'bằng lái', 'đăng kiểm', 'xe'
  ],
  'Ăn uống': [
    'ăn', 'uống', 'an uong', 'phở', 'pho', 'cơm', 'com', 'bún', 'bun', 'miến', 'hủ tiếu', 'hu tieu',
    'bánh mì', 'banh mi', 'lẩu', 'lau', 'nướng', 'nuong', 'quán ăn', 'quan an', 'nhà hàng', 'nha hang',
    'cà phê', 'ca phe', 'cafe', 'trà sữa', 'tra sua', 'sinh tố', 'nước ép', 'nước uống', 'nuoc uong',
    'ăn sáng', 'an sang', 'ăn trưa', 'an trua', 'ăn tối', 'an toi', 'ăn vặt', 'an vat', 'nhậu', 'nhau',
    'bia', 'rượu', 'đi chợ', 'di cho', 'siêu thị', 'sieu thi', 'thịt', 'cá', 'rau', 'trái cây', 'đồ ăn'
  ],
  'Hóa đơn & Điện nước': [
    'hóa đơn', 'hoa don', 'tiền điện', 'tien dien', 'tiền nước', 'tien nuoc', 'điện', 'nước',
    'internet', 'wifi', '4g', '5g', 'điện thoại', 'dien thoai', 'nạp tiền', 'nap tien', 'nạp thẻ',
    'truyền hình', 'phí chung cư', 'rác', 'tiền phòng', 'tien phong', 'tiền nhà', 'tien nha',
    'thuê nhà', 'thue nha', 'nhà ở', 'nha o', 'phí dịch vụ', 'phí quản lý'
  ],
  'Mua sắm/Giải trí': [
    'mua sắm', 'mua sam', 'giải trí', 'giai tri', 'du lịch', 'du lich', 'quần áo', 'quan ao',
    'giày dép', 'giay dep', 'đồ dùng', 'mỹ phẩm', 'skincare', 'tiki', 'shopee', 'lazada',
    'tiktok shop', 'phụ kiện', 'túi xách', 'đồng hồ', 'xem phim', 'vé xem phim', 'rạp phim',
    'karaoke', 'chơi game', 'choi game', 'nạp game', 'nap game', 'khách sạn', 'homestay', 'resort',
    'tai nghe', 'sạc', 'điện thoại mới', 'laptop', 'đồ gia dụng'
  ],
  'Sức khỏe': [
    'sức khỏe', 'suc khoe', 'y tế', 'y te', 'thuốc', 'thuoc', 'tiền thuốc', 'nhà thuốc', 'dược phẩm',
    'khám bệnh', 'kham benh', 'bệnh viện', 'benh vien', 'nha khoa', 'răng', 'mắt', 'kính cận',
    'bảo hiểm y tế', 'bác sĩ', 'bac si', 'thực phẩm chức năng', 'vitamin', 'gym', 'yoga', 'thể thao'
  ],
  'Con cái': [
    'con cái', 'con cai', 'tiền học', 'tien hoc', 'học phí', 'hoc phi', 'bỉm', 'bim', 'sữa', 'sua',
    'đồ chơi', 'do choi', 'trường học', 'truong hoc', 'gia sư', 'tiền con', 'sách vở', 'dụng cụ học tập',
    'học thêm', 'mẫu giáo', 'mầm non'
  ],
  'Trả nợ': [
    'trả nợ', 'tra no', 'vay nợ', 'vay no', 'mượn tiền', 'muon tien', 'trả góp', 'tra gop',
    'ngân hàng', 'ngan hang', 'cho vay', 'đòi nợ', 'tín dụng', 'lãi suất', 'đáo hạn'
  ],
  'Thu nhập': [
    'thu nhập', 'thu nhap', 'lương', 'luong', 'thưởng', 'thuong', 'hoa hồng', 'lì xì', 'li xi',
    'đầu tư', 'dau tu', 'chứng khoán', 'bất động sản', 'lãi', 'tiền lương', 'nhận tiền', 'nhan tien',
    'bán hàng', 'ban hang', 'freelance', 'làm thêm'
  ]
};

// Check if phrase contains a keyword using exact word boundaries
function containsWordKeyword(text: string, kw: string): boolean {
  const cleanText = text.toLowerCase().normalize('NFC');
  const cleanKw = kw.toLowerCase().normalize('NFC');

  // Short keywords like "ăn", "xe", "bún" require whole-word boundary
  if (cleanKw.length <= 4) {
    const regex = new RegExp(`(?:^|\\s|[.,!?:;])${cleanKw}(?:$|\\s|[.,!?:;])`, 'i');
    return regex.test(cleanText);
  }

  return cleanText.includes(cleanKw);
}

function formatYMD(dateInput?: Date | string | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const { text, currentDate, categories } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp văn bản giọng nói' },
        { status: 400 }
      );
    }

    const todayDateStr = formatYMD(currentDate);
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let rawResult: any = null;

    // Build category context string from user categories
    const categoryNamesList = categories && categories.length > 0
      ? categories.filter((c: any) => c.parent_id !== null).map((c: any) => c.name)
      : ['Ăn uống', 'Di chuyển', 'Hóa đơn & Điện nước', 'Mua sắm/Giải trí', 'Sức khỏe', 'Con cái', 'Trả nợ', 'Thu nhập'];

    // Call Gemini AI if key is configured
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
Bạn là một trợ lý tài chính gia đình thông minh tiếng Việt. Hãy phân tích ngữ cảnh câu nói giao dịch sau đây:
"${text}"

Bối cảnh ngày hiện tại của hệ thống: ${todayDateStr}
Danh sách các hạng mục khả dụng trong ứng dụng: [${categoryNamesList.join(', ')}]

QUY TẮC BẮT BUỘC PHÂN TÍCH:
1. Xác định số tiền (amount): Trích xuất con số tiền tệ chính xác theo đơn vị VND.
   - Các số tự nhiên đơn lẻ/ngắn như 30, 50, 70, 100, 35, 500 khi đứng trong ngữ cảnh chi tiêu đều HIỂU NGẦM tương ứng với đơn vị NGHÌN ĐỒNG (x 1.000):
     + 70 -> 70000 (Ví dụ: "đổ xăng 70" -> 70000 VND)
     + 30 -> 30000
     + 50 -> 50000
     + 100 -> 100000
     + 35 -> 35000
     + 500 -> 500000
   - Định dạng khác:
     + 25k / 25 ngàn / 25 nghìn -> 25000
     + 1.5 triệu / 1.5 củ / 1.5tr -> 1500000
     + 15 củ / 15 triệu -> 15000000
   - Số nguyên lớn >= 1000 (vd: 50000, 70000, 200000, 1500000) giữ nguyên giá trị VND.

2. Phân loại type: 'expense' (chi tiêu/mua/trả tiền/đổ xăng/gửi xe) hoặc 'income' (lương/thưởng/nhận tiền/được cho).

3. XÁC ĐỊNH HẠNG MỤC (category_name) DỰA THEO NGỮ CẢNH THÔNG MINH:
   - "Đổ xăng", "gửi xe", "rửa xe", "sửa xe", "Grab", "GoJek", "Be", "vé xe", "vé máy bay", "bãi xe" -> CHẮC CHẮN LÀ "Di chuyển".
   - "Cơm", "phở", "bún", "bánh mì", "cà phê", "trà sữa", "ăn sáng", "ăn trưa", "ăn tối", "đi chợ", "siêu thị" -> CHẮC CHẮN LÀ "Ăn uống".
   - "Tiền điện", "tiền nước", "internet", "wifi", "tiền nhà", "tiền phòng", "nạp thẻ điện thoại" -> "Hóa đơn & Điện nước".
   - "Mua quần áo", "mỹ phẩm", "Shopee", "du lịch", "xem phim", "chơi game" -> "Mua sắm/Giải trí".
   - "Mua thuốc", "khám bệnh", "bác sĩ", "nha khoa", "bệnh viện" -> "Sức khỏe".
   - "Tiền học", "học phí", "sữa con", "bỉm", "đồ chơi" -> "Con cái".
   - "Trả nợ", "trả góp", "vay nợ", "tín dụng" -> "Trả nợ".
   - "Lương", "thưởng", "lì xì", "bán hàng", "làm thêm" -> "Thu nhập".

   BẮT BUỘC CHỌN 1 TÊN TRONG DANH SÁCH HẠNG MỤC TRÊN KHÔNG ĐƯỢC TỰ CHẾ TÊN MỚI.

4. Trích xuất description: Tóm tắt nội dung giao dịch ngắn gọn (vd: "Đổ xăng", "Đi ăn cơm tấm", "Trả tiền điện").
5. Giải mã transaction_date: Chuyển các cụm từ như "hôm qua", "sáng nay", "hôm kia" thành YYYY-MM-DD dựa vào ngày hiện tại (${todayDateStr}).

Trả về duy nhất dữ liệu JSON với cấu trúc:
{
  "amount": 70000,
  "type": "expense",
  "category_name": "Di chuyển",
  "description": "Đổ xăng",
  "transaction_date": "YYYY-MM-DD"
}
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        rawResult = JSON.parse(responseText);
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to smart regex parser:', geminiError);
      }
    } else {
      console.log('Using enhanced smart Vietnamese parser logic.');
    }

    // Fallback rule-based parser if Gemini Key is missing or API failed
    if (!rawResult) {
      rawResult = mockVietnameseParser(text, todayDateStr);
    }

    // Normalize category mapping against Frontend category list
    const finalParsedData = normalizeCategoryResult(rawResult, text, categories, todayDateStr);
    return NextResponse.json(finalParsedData);

  } catch (error: any) {
    console.error('Error parsing voice input:', error);
    return NextResponse.json(
      { error: 'Không thể phân tích giọng nói: ' + (error.message || error) },
      { status: 500 }
    );
  }
}

// Normalize and map category name & id to exact available categories
function normalizeCategoryResult(raw: any, rawText: string, categories: any[], todayDateStr: string) {
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

  // 2. Keyword Mapping Dictionary Match with Word Boundary Protection
  if (!matchedCat) {
    // Specific transport keywords check first to prevent false matches
    const transportKeywords = CATEGORY_MAPPING_RULES['Di chuyển'];
    const isTransportMatch = transportKeywords.some((kw) => containsWordKeyword(textLower, kw));
    if (isTransportMatch) {
      matchedCat = availableCats.find((c: any) => c.name.toLowerCase().includes('di chuyển') || c.name.toLowerCase().includes('xe'));
    }
  }

  if (!matchedCat) {
    for (const [standardName, keywords] of Object.entries(CATEGORY_MAPPING_RULES)) {
      const matchKeyword = keywords.some((kw) => containsWordKeyword(textLower, kw));
      if (matchKeyword) {
        matchedCat = availableCats.find(
          (c: any) => c.name.toLowerCase().includes(standardName.toLowerCase()) || standardName.toLowerCase().includes(c.name.toLowerCase())
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

  // Smart robust amount parsing
  const amount = parseVnAmount(raw?.amount, rawText);

  return {
    amount,
    type,
    category_id: matchedCat.id,
    category_name: matchedCat.name,
    description: raw?.description || rawText,
    transaction_date: raw?.transaction_date || todayDateStr,
  };
}

// Smart robust amount parsing for Vietnamese voice & text inputs
function parseVnAmount(val: any, rawText: string): number {
  const text = (rawText || '').toLowerCase().trim();

  // Word-to-number map
  const wordMap: { [key: string]: number } = {
    'không': 0, 'khong': 0,
    'một': 1, 'mot': 1, 'mốt': 1,
    'hai': 2,
    'ba': 3,
    'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4,
    'năm': 5, 'nam': 5, 'lăm': 5, 'lam': 5, 'nhăm': 5,
    'sáu': 6, 'sau': 6,
    'bảy': 7, 'bay': 7,
    'tám': 8, 'tam': 8,
    'chín': 9, 'chin': 9,
    'mười': 10, 'muoi': 10, 'chục': 10, 'mươi': 10,
    'trăm': 100, 'tram': 100,
    'nửa': 0.5, 'nua': 0.5,
  };

  const kMatch = lower.match(/(\d+[\.,]?\d*|\b(?:một|mot|hai|ba|bốn|bon|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\b)\s*(k|ngàn|ngan|nghìn|nghin)/i);
  if (kMatch) {
    const numPart = wordMap[kMatch[1].toLowerCase()] || parseFloat(kMatch[1].replace(',', '.'));
    if (!isNaN(numPart)) return numPart * 1000;
  }

  const digitsMatch = lower.match(/(\d+[\.,]?\d*)/g);
  if (digitsMatch && digitsMatch.length > 0) {
    const rawVal = parseFloat(digitsMatch[digitsMatch.length - 1].replace(',', '.'));
    if (!isNaN(rawVal)) {
      return rawVal < 1000 ? rawVal * 1000 : rawVal;
    }
  }

  return 0;
}

// Improved smart rule-based parser
function mockVietnameseParser(text: string, todayDateStr: string) {
  const lower = text.toLowerCase();
  const amount = parseVnAmount(null, text);

  // Type
  const isIncome = lower.includes('lương') || lower.includes('luong') || lower.includes('thưởng') || lower.includes('thuong') || lower.includes('nhận') || lower.includes('nhan') || lower.includes('thu');
  const type = isIncome ? 'income' : 'expense';

  // Relative Date
  let dateObj = todayDateStr ? new Date(todayDateStr) : new Date();
  if (lower.includes('hôm qua') || lower.includes('hom qua')) {
    dateObj.setDate(dateObj.getDate() - 1);
  } else if (lower.includes('hôm kia') || lower.includes('hom kia')) {
    dateObj.setDate(dateObj.getDate() - 2);
  }
  const transaction_date = formatYMD(dateObj);

  // Description cleanup
  const cleanDesc = text
    .replace(/\d+[\.,]?\d*\s*(k|củ|cu|tr|triệu|trieu|ngàn|ngan|nghìn|nghin)?/gi, '')
    .replace(/\b(một|mot|hai|ba|bốn|bon|năm|nam|sáu|sau|bảy|bay|tám|tam|chín|chin|mười|muoi)\b\s*(củ|cu|triệu|trieu|tr|k|ngàn|ngan|nghìn|nghin)?/gi, '')
    .trim();

  return {
    amount,
    type,
    description: cleanDesc || text,
    transaction_date,
  };
}

