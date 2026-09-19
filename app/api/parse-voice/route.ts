import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Clean Chrome Speech Recognition Vietnamese phonetic errors
function cleanVietnameseSTTAnomalies(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Chrome STT anomaly: "Bách Hóa Xanh" phonetics ("100 multiple xanh", "100 multi xanh", "100 hóa xanh", "100 hoá xanh", "bắt 100 xanh", "bắp hóa xanh", "100 100 100")
  text = text.replace(/(?:100|bách|bắt|bắp|bác|bát|bắc)\s*(?:multiple|multi|multiform|hóa|hoá|100)?\s*(?:xanh)/gi, 'Bách Hóa Xanh');
  text = text.replace(/(?:100|bách|bắt|bắp|bác|bát|bắc)\s+(?:multiple|multi|multiform|hóa|hoá)/gi, 'Bách Hóa');
  text = text.replace(/^100\s+100\s+100$/gi, 'Bách Hóa Xanh');
  text = text.replace(/bách\s+hoá\s+xanh/gi, 'Bách Hóa Xanh');

  // 2. Other store brand speech fixes
  text = text.replace(/thế\s+di\s+động/gi, 'Thế Giới Di Động');
  text = text.replace(/win\s*mart/gi, 'WinMart');
  text = text.replace(/coop\s*mart/gi, 'Co.opmart');

  return text;
}

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
    'bia', 'rượu', 'đi chợ', 'di cho', 'siêu thị', 'sieu thi', 'thịt', 'cá', 'rau', 'trái cây', 'đồ ăn',
    'bách hóa xanh', 'bach hoa xanh', 'bách hóa', 'bách hoá', '100 hóa xanh', '100 hoá xanh', 'winmart', 'coopmart'
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
    'bảo hiểm y tế', 'bác sĩ', 'bac si', 'thực phẩm chức năng', 'vitamin', 'gym', 'yoga', 'thể thao',
    'cắt tóc', 'cat toc', 'hớt tóc', 'hot toc', 'gội đầu', 'goi dau', 'spa', 'làm đẹp', 'lam dep',
    'làm tóc', 'lam toc', 'nail', 'uốn tóc', 'nhuộm tóc'
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
    const { text: rawText, currentDate, categories, voiceRules } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp văn bản giọng nói' },
        { status: 400 }
      );
    }

    // 1. Pre-clean Chrome STT Vietnamese phonetic anomalies ("100 hóa xanh" -> "Bách Hóa Xanh")
    let text = cleanVietnameseSTTAnomalies(rawText);

    // 2. Apply Custom User Voice Rules trained by user in Categories Tab
    if (voiceRules && Array.isArray(voiceRules)) {
      voiceRules.forEach((rule: any) => {
        if (rule.misspoken_phrase && rule.correct_phrase) {
          const kw = rule.misspoken_phrase.trim();
          const rep = rule.correct_phrase.trim();
          if (kw && rep) {
            const regex = new RegExp(kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            text = text.replace(regex, rep);
          }
        }
      });
    }

    const todayDateStr = formatYMD(currentDate);
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    let rawResult: any = null;

    // Fetch categories & User Preference Memory Rules from Supabase
    let customRules: any[] = [];
    let activeCategories: any[] = categories || [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rulesData } = await supabase.from('category_rules').select('*');
        if (rulesData && rulesData.length > 0) {
          customRules = rulesData;
          console.log('[Supabase User Preference Rules Loaded]:', customRules.length, 'rules');
        }
      } catch (err) {
        console.warn('Could not fetch custom category_rules:', err);
      }

      if (activeCategories.length === 0) {
        try {
          const { data: dbCats } = await supabase.from('categories').select('*');
          if (dbCats && dbCats.length > 0) {
            activeCategories = dbCats;
          }
        } catch (err) {
          console.warn('Could not fetch categories from Supabase:', err);
        }
      }
    }

    // Build category context string from user categories
    const categoryNamesList = activeCategories.length > 0
      ? activeCategories.filter((c: any) => c.parent_id !== null).map((c: any) => c.name)
      : ['Ăn uống', 'Di chuyển', 'Hóa đơn & Điện nước', 'Mua sắm', 'Sức khỏe & Y tế', 'Giải trí', 'Con cái', 'Thu nhập'];

    // Call Gemini AI if key is configured
    if (apiKey) {
      try {
        console.log('Gemini API Key detected. Calling Gemini API gemini-3.6-flash...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.6-flash',
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
   - Cách nói hàng TRĂM NGHÌN NÓI TẮT KHÔNG ĐƠN VỊ:
     + "một trăm tám" / "trăm tám" -> 180000 VND (180k)
     + "một trăm tư" / "trăm tư" -> 140000 VND (140k)
     + "một trăm mốt" / "trăm mốt" -> 110000 VND (110k)
     + "một trăm hai" / "trăm hai" -> 120000 VND (120k)
     + "một trăm ba" / "trăm ba" -> 130000 VND (130k)
     + "một trăm rưỡi" / "trăm rưỡi" -> 150000 VND (150k)
     + "hai trăm rưỡi" -> 250000 VND (250k)
     + "một trăm sáu" / "trăm sáu" -> 160000 VND
     + "một trăm bảy" / "trăm bảy" -> 170000 VND
     + "một trăm chín" / "trăm chín" -> 190000 VND
     + "một trăm lẻ tám" / "trăm linh tám" -> 108000 VND
     + "một trăm lẻ tư" / "trăm linh tư" -> 104000 VND
   - Cách nói hàng TRIỆU NÓI TẮT:
     + "một triệu tám" / "1tr8" -> 1800000 VND (1.8 triệu)
     + "hai triệu rưỡi" / "2tr5" -> 2500000 VND (2.5 triệu)
     + "ba triệu tư" / "3tr4" -> 3400000 VND (3.4 triệu)
   - Các số tự nhiên đơn lẻ/ngắn như 30, 50, 70, 100, 140, 180, 500 khi đứng trong ngữ cảnh chi tiêu đều HIỂU NGẦM đơn vị NGHÌN ĐỒNG (x 1.000):
     + 70 -> 70000
     + 180 -> 180000
     + 140 -> 140000
     + 50 -> 50000, 30 -> 30000, 500 -> 500000
   - Định dạng khác:
     + 25k / 25 ngàn / 25 nghìn -> 25000
     + 1.5 triệu / 1.5 củ / 1.5tr -> 1500000
   - Số nguyên lớn >= 1000 (vd: 50000, 70000, 180000, 1400000) giữ nguyên giá trị VND.

2. Phân loại type: 'expense' (chi tiêu/mua/trả tiền/đổ xăng/gửi xe) hoặc 'income' (lương/thưởng/nhận tiền/được cho).

3. XÁC ĐỊNH HẠNG MỤC (category_name) DỰA THEO NGỮ CẢNH THÔNG MINH:
   - "Đổ xăng", "gửi xe", "rửa xe", "sửa xe", "Grab", "GoJek", "Be", "vé xe", "vé máy bay", "bãi xe" -> CHẮC CHẮN LÀ "Di chuyển".
   - "Cơm", "phở", "bún", "bánh mì", "cà phê", "trà sữa", "ăn sáng", "ăn trưa", "ăn tối", "đi chợ", "siêu thị" -> CHẮC CHẮN LÀ "Ăn uống".
   - "Tiền điện", "tiền nước", "internet", "wifi", "tiền nhà", "tiền phòng", "nạp thẻ điện thoại" -> "Hóa đơn & Điện nước".
   - "Mua quần áo", "mỹ phẩm", "Shopee", "du lịch", "xem phim", "chơi game" -> "Mua sắm/Giải trí".
   - "Mua thuốc", "khám bệnh", "bác sĩ", "nha khoa", "bệnh viện", "cắt tóc", "hớt tóc", "gội đầu", "spa", "làm đẹp" -> "Sức khỏe".
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

    // Normalize category mapping against Frontend category list & User Memory Preferences
    const finalParsedData = normalizeCategoryResult(rawResult, text, activeCategories, todayDateStr, customRules);
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
function normalizeCategoryResult(raw: any, rawText: string, categories: any[], todayDateStr: string, customRules: any[] = []) {
  const type = raw?.type === 'income' ? 'income' : 'expense';
  const textLower = rawText.toLowerCase();
  const catInputLower = (raw?.category_name || raw?.category_id || '').toLowerCase();

  // Find candidate categories for this type (only children categories)
  const availableCats = categories && categories.length > 0
    ? categories.filter((c: any) => c.type === type && c.parent_id !== null)
    : [];

  let matchedCat: any = null;

  // 0. User Preference Memory Rules Match (HIGHEST PRIORITY!)
  if (customRules && customRules.length > 0) {
    const textClean = textLower.trim();
    const matchedRule = customRules.find((rule: any) => {
      const kw = (rule.keyword || '').toLowerCase().trim();
      if (!kw) return false;
      return textClean === kw || containsWordKeyword(textClean, kw);
    });

    if (matchedRule) {
      const targetCat = availableCats.find(
        (c: any) =>
          c.id === matchedRule.category_id ||
          c.name.toLowerCase() === matchedRule.category_name.toLowerCase() ||
          c.name.toLowerCase().includes(matchedRule.category_name.toLowerCase()) ||
          matchedRule.category_name.toLowerCase().includes(c.name.toLowerCase())
      );
      if (targetCat) {
        matchedCat = targetCat;
        console.log('[AI Memory Preference Match!]:', matchedRule.keyword, '->', matchedCat.name);
      }
    }
  }

  // 1. Exact match by category name or category id (ONLY IF memory rule was not matched!)
  if (!matchedCat && catInputLower) {
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
  // 1. Direct numeric value from Gemini AI (Highest Accuracy!)
  if (typeof val === 'number' && !isNaN(val) && val > 0) {
    return val < 1000 ? val * 1000 : val;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const cleaned = val.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      return num < 1000 ? num * 1000 : num;
    }
  }

  const text = (rawText || '').toLowerCase().trim();
  if (!text) return 0;

  const wordToDigit: { [key: string]: number } = {
    'không': 0, 'khong': 0,
    'một': 1, 'mot': 1, 'mốt': 1,
    'hai': 2,
    'ba': 3,
    'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4,
    'năm': 5, 'nam': 5, 'lăm': 5, 'lam': 5, 'nhăm': 5, 'rưỡi': 5, 'ruoi': 5,
    'sáu': 6, 'sau': 6,
    'bảy': 7, 'bay': 7,
    'tám': 8, 'tam': 8,
    'chín': 9, 'chin': 9,
  };

  const numWordsPattern = 'một|mot|mốt|hai|ba|bốn|bon|tư|tu|năm|nam|lăm|lam|nhăm|rưỡi|ruoi|sáu|sau|bảy|bay|tám|tam|chín|chin';

  // Pattern A: Millions spoken ("một triệu tám", "hai triệu rưỡi", "ba triệu tư", "1tr8", "2.5tr")
  const millionRegex = new RegExp(`(?:^|\\s)(\\d+[\\.,]?\\d*|${numWordsPattern})\\s*(?:củ|cu|triệu|trieu|tr(?![ăa]m))(?:\\s*|$)(?:và\\s+)?(lẻ|linh)?\\s*(\\d+|${numWordsPattern})?`, 'i');
  const millionMatch = text.match(millionRegex);

  if (millionMatch) {
    const headStr = millionMatch[1];
    const isLe = !!millionMatch[2];
    const tailStr = millionMatch[3];

    const head = wordToDigit[headStr] !== undefined ? wordToDigit[headStr] : parseFloat(headStr.replace(',', '.'));
    if (!isNaN(head)) {
      if (!tailStr) return Math.round(head * 1000000);
      const tail = wordToDigit[tailStr] !== undefined ? wordToDigit[tailStr] : parseFloat(tailStr);
      if (!isNaN(tail)) {
        if (isLe) return Math.round(head * 1000000 + tail * 1000);
        return tail < 10 ? Math.round(head * 1000000 + tail * 100000) : Math.round(head * 1000000 + tail * 1000);
      }
    }
  }

  // Pattern B: Hundreds spoken ("một trăm tám", "một trăm tư", "trăm tư", "trăm tám", "trăm rưỡi", "hai trăm rưỡi", "100k")
  const hundredRegex = new RegExp(`(?:^|\\s)(\\d+|${numWordsPattern})?\\s*(?:trăm|tram)(?:\\s*|$)(lẻ|linh)?\\s*(\\d+|${numWordsPattern})?`, 'i');
  const hundredMatch = text.match(hundredRegex);

  if (hundredMatch) {
    const headStr = hundredMatch[1];
    const isLe = !!hundredMatch[2];
    const tailStr = hundredMatch[3];

    const head = headStr ? (wordToDigit[headStr] !== undefined ? wordToDigit[headStr] : parseFloat(headStr)) : 1;
    if (!isNaN(head)) {
      if (!tailStr) return Math.round(head * 100000);
      const tail = wordToDigit[tailStr] !== undefined ? wordToDigit[tailStr] : parseFloat(tailStr);
      if (!isNaN(tail)) {
        if (isLe) return Math.round((head * 100 + tail) * 1000);
        return tail < 10 ? Math.round((head * 100 + tail * 10) * 1000) : Math.round((head * 100 + tail) * 1000);
      }
    }
  }

  // Pattern C: Explicit Thousand units ("18k", "18 ngàn", "18 nghìn", "70k", "755k")
  const thousandRegex = new RegExp(`(?:^|\\s)(\\d+[\\.,]?\\d*|${numWordsPattern})\\s*(?:k|ngàn|ngan|nghìn|nghin)(?:\\s+|$)`, 'i');
  const thousandMatch = text.match(thousandRegex);
  if (thousandMatch) {
    const kVal = wordToDigit[thousandMatch[1]] !== undefined ? wordToDigit[thousandMatch[1]] : parseFloat(thousandMatch[1].replace(',', '.'));
    if (!isNaN(kVal)) return Math.round(kVal * 1000);
  }

  // Pattern D: Bare numbers at end of string ("đổ xăng 70", "mua kính 180")
  const digitsMatch = text.match(/(\d+[\.,]?\d*)/g);
  if (digitsMatch && digitsMatch.length > 0) {
    const rawVal = parseFloat(digitsMatch[digitsMatch.length - 1].replace(/[.,]/g, ''));
    if (!isNaN(rawVal)) {
      return rawVal < 1000 ? Math.round(rawVal * 1000) : rawVal;
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
  const numWordsPattern = 'một|mot|mốt|hai|ba|bốn|bon|tư|tu|năm|nam|lăm|lam|nhăm|rưỡi|ruoi|sáu|sau|bảy|bay|tám|tam|chín|chin';
  const cleanDesc = text
    .replace(new RegExp(`(?:^|\\s)(?:${numWordsPattern}|\\d+)*\\s*(?:triệu|trieu|củ|cu|tr(?![ăa]m)|trăm|tram|ngàn|ngan|nghìn|nghin|k)\\s*(?:và\\s+)?(?:lẻ|linh)?\\s*(?:${numWordsPattern}|\\d+)?(?:\\s+|$)`, 'gi'), ' ')
    .replace(new RegExp(`(?:^|\\s)(?:một|mot|mốt|hai|ba|bốn|bon|tư|tu|năm|nam|lăm|lam|nhăm|rưỡi|ruoi|sáu|sau|bảy|bay|tám|tam|chín|chin)\\s+(?:tám|tư|mốt|hai|ba|bốn|năm|sáu|bảy|chín)(?:\\s+|$)`, 'gi'), ' ')
    .replace(/\d+[\.,]?\d*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    amount,
    type,
    description: cleanDesc || text,
    transaction_date,
  };
}

