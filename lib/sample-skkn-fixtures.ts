export interface SampleFixture {
  id: string;
  name: string;
  tier: "excellent" | "good" | "needs-work";
  badge: string;
  expectedScore: string;
  profile: {
    author: string;
    school: string;
    subject: string;
    level: string;
    grade: string;
    title: string;
    focus: string;
    audience: string;
    region: string;
    year: string;
    textbook: string;
    duration: string;
    facilities: string;
    technology: string;
    novelty: string;
  };
  sampleDocument: string;
}

export const SAMPLE_SKKN_FIXTURES: SampleFixture[] = [
  {
    id: "sample-flipped-classroom",
    name: "Mẫu Xuất sắc: Lớp học đảo ngược Tin học 11",
    tier: "excellent",
    badge: "92 - 95 điểm (Giải A)",
    expectedScore: "94/100",
    profile: {
      author: "Nguyễn Văn An",
      school: "Trường THPT Chuyên Hùng Vương",
      subject: "Tin học",
      level: "THPT",
      grade: "Lớp 11",
      title: "Ứng dụng mô hình lớp học đảo ngược (Flipped Classroom) kết hợp nền tảng số nhằm phát triển năng lực tự học của học sinh lớp 11 trong môn Tin học",
      focus: "Chuyển giao việc tiếp thu kiến thức lý thuyết về nhà qua video vi mô và câu hỏi tương tác; dành 100% thời gian trên lớp cho phản biện, giải quyết vấn đề và thực hành dự án nhóm.",
      audience: "170 học sinh khối 11 (2 lớp thực nghiệm N=86, 2 lớp đối chứng N=84)",
      region: "Tỉnh Tây Ninh",
      year: "2026 - 2027",
      textbook: "Kết nối tri thức với cuộc sống",
      duration: "Từ 09/2026 đến 03/2027",
      facilities: "Phòng máy tính nối mạng LAN, màn hình tương tác thông minh, đường truyền cáp quang",
      technology: "LMS Canvas, Google Classroom, Edpuzzle, Canva, Google Forms kiểm tra tự động",
      novelty: "Quy trình 3 bước khép kín 'Trước - Trong - Sau giờ học' có bảng kiểm Rubric đánh giá năng lực tự học và số liệu đối chứng thống kê định lượng p < 0.05.",
    },
    sampleDocument: `# TÊN ĐỀ TÀI: ỨNG DỤNG MÔ HÌNH LỚP HỌC ĐẢO NGƯỢC (FLIPPED CLASSROOM) KẾT HỢP NỀN TẢNG SỐ NHẰM PHÁT TRIỂN NĂNG LỰC TỰ HỌC CỦA HỌC SINH LỚP 11 TRONG MÔN TIN HỌC

## I. ĐẶT VẤN ĐỀ
Chương trình GDPT 2018 đặt trọng tâm chuyển đổi từ truyền thụ kiến thức sang hình thành và phát triển phẩm chất, năng lực học sinh, trong đó năng lực tự chủ và tự học là nền tảng cốt lõi. Tuy nhiên, trong môn Tin học 11, học sinh thường thụ động nghe giảng lý thuyết, thời gian thực hành máy tính bị hạn chế. Đề tài áp dụng mô hình lớp học đảo ngược (Flipped Classroom) kết hợp nền tảng số nhằm giải quyết triệt để vấn đề này trên 170 học sinh khối 11.

## II. CƠ SỞ LÝ LUẬN VÀ THỰC TRẠNG
1. Cơ sở lý luận: Dựa trên thang đo tư duy Bloom sửa đổi và lý thuyết kiến tạo của Vygotsky.
2. Thực trạng đầu năm: Khảo sát 170 học sinh cho thấy 68.2% học sinh chỉ học khi có giáo viên đôn đốc; điểm trung bình đánh giá năng lực tự học đầu năm chỉ đạt 5.4/10.

## III. CÁC BIỆN PHÁP THỰC HIỆN
1. Biện pháp 1: Thiết kế ngân hàng bài giảng vi mô (Micro-learning 5-7 phút) tích hợp câu hỏi chèn tự động trên Edpuzzle.
2. Biện pháp 2: Xây dựng bảng kiểm tự đánh giá (Pre-class Rubric) giúp học sinh tự theo dõi tiến độ hoàn thành nhiệm vụ trước giờ lên lớp.
3. Biện pháp 3: Tổ chức hoạt động giải quyết vấn đề và học theo dự án (Project-based learning) trên lớp với sự hỗ trợ của giáo viên.

## IV. HIỆU QUẢ THỰC NGHIỆM
Sau 6 tháng thực nghiệm trên 2 lớp thực nghiệm (N=86) và 2 lớp đối chứng (N=84):
- Tỷ lệ học sinh đạt năng lực tự học mức Tốt tăng từ 24.1% lên 78.3% (lớp đối chứng chỉ đạt 31.5%).
- Điểm kiểm tra định kỳ học kỳ 1: Lớp thực nghiệm đạt 8.42 ± 0.65; Lớp đối chứng đạt 7.15 ± 0.82 (sai số thống kê p < 0.05).

## V. KẾT LUẬN VÀ KIẾN NGHỊ
Mô hình đã chứng minh tính hiệu quả vượt trội, kích hoạt sự chủ động và khả năng sáng tạo của học sinh. Đề xuất nhân rộng mô hình cho các bộ môn Vật lý, Hóa học và báo cáo tại Cụm chuyên môn trường THPT.`,
  },
  {
    id: "sample-math-word-problems",
    name: "Mẫu Khá: Giải toán có lời văn Lớp 4",
    tier: "good",
    badge: "75 - 78 điểm (Giải C)",
    expectedScore: "76/100",
    profile: {
      author: "Trần Thị Mai",
      school: "Trường Tiểu học Chu Văn An",
      subject: "Toán học",
      level: "Tiểu học",
      grade: "Lớp 4",
      title: "Một số biện pháp rèn luyện kỹ năng giải toán có lời văn cho học sinh lớp 4",
      focus: "Khắc phục tình trạng học sinh đọc chưa kỹ đề, nhầm lẫn các phép tính và lúng túng khi trình bày bài giải toán nhiều bước.",
      audience: "38 học sinh lớp 4C",
      region: "Huyện Châu Thành",
      year: "2026 - 2027",
      textbook: "Chân trời sáng tạo",
      duration: "Từ 10/2026 đến 02/2027",
      facilities: "Phòng học chuẩn có máy chiếu",
      technology: "PowerPoint bài giảng tương tác, phiếu học tập màu",
      novelty: "Sử dụng kỹ thuật sơ đồ tư duy đoạn thẳng và các thẻ từ khóa (nhiều hơn, ít hơn, gấp lần) giúp học sinh trực quan hóa mối quan hệ đại lượng.",
    },
    sampleDocument: `# TÊN ĐỀ TÀI: MỘT SỐ BIỆN PHÁP RÈN LUYỆN KỸ NĂNG GIẢI TOÁN CÓ LỜI VĂN CHO HỌC SINH LỚP 4

## I. MỞ ĐẦU
Môn Toán ở tiểu học giữ vai trò quan trọng trong việc rèn luyện tư duy logic. Dạng toán có lời văn lớp 4 đòi hỏi học sinh kết hợp kỹ năng đọc hiểu ngôn ngữ và tư duy tính toán. Tuy nhiên, nhiều học sinh lớp 4C còn e ngại và sợ giải toán có lời văn.

## II. THỰC TRẠNG
Qua khảo sát chất lượng đầu năm ở lớp 4C (38 học sinh):
- 15 em (39.5%) chưa biết tóm tắt đề toán.
- 12 em (31.6%) nhầm lẫn giữa phép tính nhân và chia khi gặp cụm từ 'gấp lên' hoặc 'giảm đi'.

## III. CÁC BIỆN PHÁP
1. Hướng dẫn học sinh dùng bút dạ màu gạch chân từ khóa chỉ mối quan hệ toán học.
2. Rèn kỹ năng biểu diễn bài toán bằng sơ đồ đoạn thẳng trực quan.
3. Tổ chức trò chơi 'Đố bạn tìm phép tính' trong 5 phút khởi động.

## IV. KẾT QUẢ ĐẠT ĐƯỢC
Cuối học kỳ 1, tỷ lệ học sinh hoàn thành tốt dạng toán có lời văn tăng từ 35% lên 72%. Các em tự tin hơn khi lên bảng trình bày bài giải.

## V. BÀI HỌC KINH NGHIỆM
Giáo viên cần kiên nhẫn, phân hóa nhiệm vụ phù hợp với từng đối tượng học sinh, tránh gây áp lực tâm lý.`,
  },
  {
    id: "sample-professional-meeting",
    name: "Mẫu Cần Hoàn Thiện: Sinh hoạt tổ chuyên môn",
    tier: "needs-work",
    badge: "45 - 48 điểm (Chưa đạt)",
    expectedScore: "46/100",
    profile: {
      author: "Lê Hoàng Long",
      school: "Trường THCS Lê Quý Đôn",
      subject: "Quản lý giáo dục / Sinh hoạt chuyên môn",
      level: "THCS",
      grade: "Toàn trường",
      title: "Nâng cao chất lượng sinh hoạt tổ chuyên môn trường THCS",
      focus: "Đề xuất các biện pháp duy trì nền nếp họp tổ chuyên môn 2 tuần/lần và khuyến khích giáo viên phát biểu.",
      audience: "24 giáo viên trong nhà trường",
      region: "Thị xã Hòa Thành",
      year: "2026 - 2027",
      textbook: "Tất cả các bộ sách",
      duration: "Cả năm học",
      facilities: "Phòng họp hội đồng",
      technology: "Nhóm Zalo nội bộ",
      novelty: "Nhắc nhở giáo viên tham gia họp đầy đủ và đúng giờ.",
    },
    sampleDocument: `# TÊN ĐỀ TÀI: NÂNG CAO CHẤT LƯỢNG SINH HOẠT TỔ CHUYÊN MÔN TRƯỜNG THCS

## I. MỞ ĐẦU
Sinh hoạt tổ chuyên môn là hoạt động quan trọng trong nhà trường nhằm trao đổi nghiệp vụ và nâng cao tay nghề giáo viên. Nhận thấy vai trò quan trọng đó, tôi chọn đề tài này.

## II. THỰC TRẠNG
Một số buổi sinh hoạt tổ còn mang tính hình thức, nội dung đơn điệu, một vài giáo viên còn ngại phát biểu ý kiến hoặc đi họp chưa đúng giờ.

## III. GIẢI PHÁP
1. Yêu cầu tổ chuyên môn duy trì lịch sinh hoạt định kỳ 2 tuần 1 lần.
2. Tổ trưởng phân công giáo viên chuẩn bị bài trước buổi họp.
3. Ban giám hiệu tăng cường kiểm tra, nhắc nhở và đôn đốc.

## IV. KẾT QUẢ
Các buổi họp tổ đã diễn ra nghiêm túc hơn, giáo viên đi họp đầy đủ hơn.

## V. KIẾN NGHỊ
Đề nghị nhà trường hỗ trợ thêm kinh phí trà nước cho các buổi sinh hoạt chuyên môn.`,
  },
];
