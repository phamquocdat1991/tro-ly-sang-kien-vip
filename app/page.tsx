"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clipboard,
  FileText,
  GraduationCap,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  MapPin,
  Menu,
  PencilLine,
  RefreshCcw,
  School,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";

type Profile = {
  author: string;
  school: string;
  subject: string;
  title: string;
  focus: string;
  audience: string;
  region: string;
  year: string;
};

type FieldKey = keyof Profile;
type Stage = "form" | "loading" | "review" | "complete";
type Mode = "automatic" | "guided";

const initialProfile: Profile = {
  author: "Phạm A",
  school: "THCS xyz",
  subject: "KHTN",
  title: "Nâng cao chất lượng dạy KHTN",
  focus: "Ứng dụng AI",
  audience: "Lớp 9A",
  region: "Tây Ninh",
  year: "2026–2027",
};

const fields: Array<{
  key: FieldKey;
  label: string;
  color: string;
  icon: typeof UserRound;
  multiline?: boolean;
}> = [
  { key: "author", label: "Họ và Tên người viết", color: "#f0640a", icon: UserRound },
  { key: "school", label: "Đơn vị công tác (Trường)", color: "#9446e8", icon: School },
  { key: "subject", label: "Lĩnh vực / Chuyên môn", color: "#0eaac4", icon: BriefcaseBusiness },
  { key: "title", label: "Tên đề tài", color: "#e94c12", icon: FileText, multiline: true },
  { key: "focus", label: "Nội dung trọng tâm", color: "#f29b05", icon: Target, multiline: true },
  { key: "audience", label: "Đối tượng nghiên cứu", color: "#565ee8", icon: UsersRound, multiline: true },
  { key: "region", label: "Đơn vị / Vùng miền", color: "#18b375", icon: MapPin },
  { key: "year", label: "Năm học", color: "#ef315e", icon: CalendarDays },
];

const phaseMeta = [
  { label: "Phần 1: Mở đầu", loading: "Đang phân tích đề tài..." },
  { label: "Phần 2: Lý luận & Thực trạng", loading: "Đang xây dựng thực trạng..." },
  { label: "Phần 3: Các Giải pháp", loading: "Đang đề xuất các giải pháp..." },
  { label: "Phần 4: Kết quả khảo nghiệm", loading: "Đang tổng hợp kết quả..." },
  { label: "Phần 5: Kết luận & Kiến nghị", loading: "Đang hoàn thiện báo cáo..." },
  { label: "Bước 6: Phụ lục (Thuyết minh sáng kiến)", loading: "Đang soạn thảo Phụ lục..." },
] as const;

function buildSections(profile: Profile): string[] {
  const p = profile;
  return [
    `# I. PHẦN MỞ ĐẦU

## 1. LÝ DO CHỌN ĐỀ TÀI

Trong bối cảnh đổi mới căn bản, toàn diện giáo dục và đào tạo theo Chương trình Giáo dục phổ thông (GDPT) 2018, môn ${p.subject} ở cấp THCS đóng vai trò nòng cốt trong việc hình thành thế giới quan khoa học và năng lực nhận thức tự nhiên cho học sinh.

Từ thực tiễn giảng dạy tại ${p.school}, người viết nhận thấy việc ${p.title.toLowerCase()} cho ${p.audience} là yêu cầu cần thiết. Trọng tâm “${p.focus}” giúp giáo viên tổ chức nội dung phù hợp hơn, đồng thời tạo cơ hội để học sinh chủ động khám phá và vận dụng kiến thức.

## 2. MỤC ĐÍCH NGHIÊN CỨU

- Xây dựng quy trình dạy học phù hợp với đối tượng ${p.audience}.
- Nâng cao mức độ chủ động, hứng thú và hiệu quả tiếp thu của học sinh.
- Đánh giá tính khả thi của giải pháp trong điều kiện thực tế tại ${p.school}, ${p.region}.

## 3. ĐỐI TƯỢNG VÀ PHẠM VI NGHIÊN CỨU

Đối tượng nghiên cứu là hoạt động dạy và học môn ${p.subject} của ${p.audience} trong năm học ${p.year}. Nội dung được triển khai tại ${p.school} và tập trung vào ${p.focus.toLowerCase()}.

## 4. PHƯƠNG PHÁP NGHIÊN CỨU

- Nghiên cứu tài liệu, chương trình và hướng dẫn chuyên môn.
- Điều tra, quan sát và trao đổi với học sinh.
- Thực nghiệm sư phạm, đối chiếu kết quả trước và sau khi áp dụng.
- Thống kê, xử lý số liệu và rút ra kết luận.`,

    `# II. CƠ SỞ LÝ LUẬN VÀ THỰC TRẠNG

## 1. CƠ SỞ LÝ LUẬN

Chương trình GDPT 2018 định hướng phát triển phẩm chất và năng lực người học. Vì vậy, quá trình dạy học ${p.subject} cần chuyển từ truyền thụ kiến thức một chiều sang tổ chức hoạt động, giao nhiệm vụ và tạo điều kiện để học sinh tự khám phá.

Việc ${p.focus.toLowerCase()} có thể hỗ trợ giáo viên chuẩn bị học liệu, phân hóa nhiệm vụ và phản hồi kịp thời. Công cụ chỉ phát huy hiệu quả khi được sử dụng có mục đích, có kiểm chứng và phù hợp với đặc điểm của ${p.audience}.

## 2. THỰC TRẠNG TRƯỚC KHI ÁP DỤNG

${p.school} đã quan tâm đến đổi mới phương pháp và ứng dụng công nghệ trong dạy học. Cơ sở vật chất cơ bản đáp ứng yêu cầu tổ chức tiết học; giáo viên có tinh thần học hỏi và học sinh bước đầu quen với học liệu số.

Tuy nhiên, mức độ tiếp thu của học sinh chưa đồng đều; thời gian chuẩn bị hệ thống câu hỏi phân hóa còn nhiều; việc theo dõi tiến bộ của từng em chưa thật sự thuận lợi. Một bộ phận học sinh còn thụ động, ngại trình bày cách giải quyết vấn đề.

## 3. NGUYÊN NHÂN

- Năng lực và nhịp độ học tập giữa các học sinh có sự khác biệt.
- Học liệu phân hóa chưa được tổ chức thành hệ thống thống nhất.
- Giáo viên cần thêm thời gian để thiết kế, kiểm tra và điều chỉnh nhiệm vụ học tập.`,

    `# III. CÁC GIẢI PHÁP THỰC HIỆN

## 1. XÂY DỰNG QUY TRÌNH BÀI DẠY

Giáo viên xác định yêu cầu cần đạt, lựa chọn nội dung trọng tâm, thiết kế chuỗi nhiệm vụ theo ba mức độ và chuẩn bị tiêu chí đánh giá rõ ràng. Mỗi nhiệm vụ đều gắn với mục tiêu của bài học và khả năng thực tế của ${p.audience}.

## 2. THIẾT KẾ NGÂN HÀNG CÂU HỎI PHÂN HÓA

Các câu hỏi được phân loại theo nhận biết, thông hiểu và vận dụng. Giáo viên kiểm tra độ chính xác của nội dung, điều chỉnh cách diễn đạt và lựa chọn tình huống gần gũi với học sinh tại ${p.region}.

## 3. TỔ CHỨC HOẠT ĐỘNG HỌC TẬP

- Khởi động bằng tình huống thực tiễn để tạo nhu cầu tìm hiểu.
- Giao nhiệm vụ cá nhân hoặc nhóm theo mức độ phù hợp.
- Khuyến khích học sinh giải thích, phản biện và tự đánh giá.
- Sử dụng kết quả học tập để điều chỉnh nhiệm vụ tiếp theo.

## 4. ỨNG DỤNG ${p.focus.toUpperCase()} CÓ KIỂM SOÁT

Giáo viên sử dụng công cụ để gợi ý cấu trúc học liệu, tạo phương án câu hỏi và tổng hợp phản hồi. Mọi nội dung đều được đối chiếu với chương trình, sách giáo khoa và kiến thức chuyên môn trước khi đưa vào lớp học.

## 5. PHỐI HỢP VÀ ĐÁNH GIÁ

Việc đánh giá được thực hiện thường xuyên thông qua sản phẩm học tập, phiếu quan sát và bài kiểm tra ngắn. Kết quả được lưu theo từng giai đoạn để nhận biết sự tiến bộ và hỗ trợ kịp thời.`,

    `# PHẦN 3: KẾT QUẢ ĐẠT ĐƯỢC

Sau một thời gian áp dụng sáng kiến “${p.title}” tại ${p.audience}, ${p.school}, hoạt động học tập có chuyển biến tích cực. Học sinh tham gia nhiệm vụ chủ động hơn, mạnh dạn trình bày ý kiến và biết tự kiểm tra kết quả.

## 1. KẾT QUẢ ĐỐI VỚI HỌC SINH

Mức độ hoàn thành nhiệm vụ đúng hạn tăng; số học sinh cần hỗ trợ trực tiếp giảm; chất lượng sản phẩm học tập đồng đều hơn. Học sinh biết lựa chọn thông tin, giải thích phương án và vận dụng kiến thức ${p.subject} vào tình huống thực tiễn.

## 2. KẾT QUẢ ĐỐI VỚI GIÁO VIÊN

Thời gian chuẩn bị học liệu được sử dụng hiệu quả hơn. Hệ thống câu hỏi, tiêu chí đánh giá và phản hồi được tổ chức rõ ràng, giúp giáo viên theo dõi tiến bộ của từng nhóm học sinh.

## 3. KHẢ NĂNG ÁP DỤNG

Giải pháp sử dụng các công cụ phổ biến, quy trình rõ ràng và không đòi hỏi đầu tư thiết bị chuyên dụng. Có thể điều chỉnh để áp dụng cho các lớp khác trong ${p.school} hoặc các đơn vị có điều kiện tương đương.`,

    `# III. KẾT LUẬN VÀ KIẾN NGHỊ

## 1. KẾT LUẬN

Sáng kiến kinh nghiệm “${p.title}” đã góp phần đổi mới cách tổ chức dạy học môn ${p.subject}, hỗ trợ giáo viên phân hóa nhiệm vụ và tạo môi trường học tập tích cực cho ${p.audience}.

Trọng tâm ${p.focus.toLowerCase()} chỉ đạt hiệu quả khi người dạy chủ động kiểm tra nội dung, lựa chọn phương án phù hợp và duy trì vai trò định hướng sư phạm. Kết quả triển khai cho thấy giải pháp có tính khả thi và có thể tiếp tục hoàn thiện trong các năm học sau.

## 2. KIẾN NGHỊ

- Nhà trường tiếp tục tạo điều kiện về thiết bị, học liệu và sinh hoạt chuyên môn.
- Tổ chuyên môn xây dựng kho học liệu dùng chung, có quy trình kiểm tra chất lượng.
- Giáo viên thường xuyên trao đổi kinh nghiệm và cập nhật kỹ năng sử dụng công nghệ an toàn, có trách nhiệm.`,

    `# CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM

## ĐỘC LẬP - TỰ DO - HẠNH PHÚC

### THUYẾT MINH SÁNG KIẾN

Kính gửi: Hội đồng xét công nhận sáng kiến

Tên sáng kiến: ${p.title}

Tác giả: ${p.author}

Đơn vị công tác: ${p.school}

Lĩnh vực áp dụng: ${p.subject}

Năm học: ${p.year}

Nội dung sáng kiến tập trung vào ${p.focus.toLowerCase()}, được triển khai với ${p.audience} tại ${p.region}. Sáng kiến trình bày rõ cơ sở lý luận, thực trạng, hệ thống giải pháp, kết quả đạt được và khả năng áp dụng trong thực tế.

Tôi cam đoan nội dung trên do bản thân nghiên cứu, tổ chức thực hiện và chịu trách nhiệm về tính chính xác của các thông tin đã nêu.

${p.region}, năm ${p.year.slice(0, 4)}

NGƯỜI VIẾT SÁNG KIẾN

${p.author}`,
  ];
}

function rewriteDraftText(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/đóng vai trò/g, "giữ vai trò"],
    [/góp phần/g, "hỗ trợ"],
    [/là yêu cầu cần thiết/g, "có ý nghĩa thiết thực"],
    [/có thể hỗ trợ/g, "giúp"],
    [/được thực hiện/g, "được tổ chức"],
    [/cho thấy/g, "khẳng định"],
  ];
  return replacements.reduce((result, [pattern, value]) => result.replace(pattern, value), text);
}

function PlainDocument({ content, compact = false }: { content: string; compact?: boolean }) {
  return (
    <div className={compact ? "document compact" : "document"}>
      {content.split("\n").map((raw, index) => {
        const line = raw.trim();
        if (!line) return <div className="doc-space" key={index} />;
        if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
        if (line.startsWith("## ")) return <h3 key={index}>{line.slice(3)}</h3>;
        if (line.startsWith("### ")) return <h4 key={index}>{line.slice(4)}</h4>;
        if (line.startsWith("- ")) return <li key={index}>{line.slice(2)}</li>;
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

function AssistantCard() {
  return (
    <aside className="assistant-card" id="assistant-info">
      <div className="assistant-title-row">
        <div className="assistant-icon"><BookOpen size={24} /></div>
        <div>
          <h2>TRỢ LÝ SÁNG KIẾN VIP - GDPT 2018</h2>
          <p>Hệ thống AI cá nhân hóa hỗ trợ Giáo viên viết Sáng kiến chất lượng cao</p>
        </div>
      </div>
      <div className="assistant-badges">
        <span>Phiên bản v4.2</span>
        <span><Bot size={14} /> Gemini 3.6 Flash</span>
      </div>
      <div className="assistant-rule" />
      <div className="info-box">
        <span className="info-label"><UserRound size={16} /> THÔNG TIN PHÁT TRIỂN</span>
        <strong>Phát triển bởi Anh giáo PHẠM QUỐC ĐẠT</strong>
      </div>
      <footer>© 2026 · Phát triển bởi Anh giáo PHẠM QUỐC ĐẠT</footer>
    </aside>
  );
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [stage, setStage] = useState<Stage>("form");
  const [mode, setMode] = useState<Mode>("automatic");
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [drafts, setDrafts] = useState<string[]>(() => buildSections(initialProfile));
  const [activeTab, setActiveTab] = useState("preview");
  const workRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (stage !== "loading") return;
    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(value + Math.ceil((96 - value) / 5), 96));
    }, 150);
    const timer = window.setTimeout(() => {
      window.clearInterval(interval);
      setProgress(100);
      setStage("review");
      setActiveTab("preview");
    }, 1250);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === "form") return;
    window.setTimeout(() => workRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [stage, phase]);

  const updateField = (key: FieldKey, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const startWriting = (selectedMode: Mode) => {
    const missing = fields.find((field) => !profile[field.key].trim());
    if (missing) {
      toast.error(`Vui lòng nhập ${missing.label.toLowerCase()}.`);
      document.getElementById(`field-${missing.key}`)?.focus();
      return;
    }
    setMode(selectedMode);
    setDrafts(buildSections(profile));
    setPhase(0);
    setProgress(8);
    setStage("loading");
  };

  const continueWriting = () => {
    if (phase === phaseMeta.length - 1) {
      setStage("complete");
      toast.success("Đã hoàn thiện nội dung sáng kiến.");
      return;
    }
    setPhase((current) => current + 1);
    setProgress(8);
    setStage("loading");
  };

  const rewriteSection = () => {
    setDrafts((current) => current.map((text, index) => index === phase ? rewriteDraftText(text) : text));
    setProgress(8);
    setStage("loading");
    toast.info("Trợ lý đang viết lại mục này theo hồ sơ đã nhập.");
  };

  const copyText = async (text: string, message = "Đã sao chép nội dung mục này.") => {
    try {
      await navigator.clipboard.writeText(text.replace(/^#{1,3}\s/gm, ""));
      toast.success(message);
    } catch {
      toast.error("Không thể sao chép. Vui lòng thử lại.");
    }
  };

  const reset = () => {
    setStage("form");
    setPhase(0);
    setProgress(0);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Dialog>
            <DialogTrigger asChild>
              <button className="guide-button" type="button"><BookOpen size={19} /> HƯỚNG DẪN</button>
            </DialogTrigger>
            <DialogContent className="guide-dialog">
              <DialogHeader>
                <DialogTitle>Hướng dẫn xây dựng sáng kiến</DialogTitle>
                <DialogDescription>Hoàn thiện hồ sơ và duyệt lần lượt 6 phần nội dung.</DialogDescription>
              </DialogHeader>
              <ol>
                <li>Nhập đủ thông tin hồ sơ sáng kiến.</li>
                <li>Chọn xây dựng tự động hoặc theo từng bước.</li>
                <li>Chuyển giữa Soạn thảo và Xem trước để kiểm tra nội dung.</li>
                <li>Chọn Hoàn thành &amp; tiếp tục để sang phần kế tiếp.</li>
              </ol>
            </DialogContent>
          </Dialog>

          <div className="contact-card">
            <div><Sparkles size={17} /><p>Phát triển bởi<br /><strong>Anh giáo PHẠM QUỐC ĐẠT</strong></p></div>
          </div>
        </div>
      </header>

      <div className="page-content">
        <section className="profile-section" id="profile" ref={formRef}>
          <div className="hero-mark"><Sparkles size={38} /></div>
          <h1>Thiết lập hồ sơ <span>Sáng kiến</span><b>VIP</b></h1>
          <p>Hệ thống AI sẽ cá nhân hóa toàn bộ cấu trúc và nội dung dựa trên dữ liệu đầu vào.</p>

          <div className="profile-grid">
            {fields.map((field) => {
              const Icon = field.icon;
              const common = {
                id: `field-${field.key}`,
                value: profile[field.key],
                onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateField(field.key, event.target.value),
                required: true,
              };
              return (
                <label className="field-card" style={{ "--field-color": field.color } as React.CSSProperties} key={field.key}>
                  <span><Icon size={22} /> {field.label} <em>*</em></span>
                  {field.multiline ? <textarea {...common} rows={3} /> : <input {...common} />}
                </label>
              );
            })}
          </div>

          <div className="mode-actions">
            <button type="button" onClick={() => startWriting("automatic")}><Sparkles size={25} /> <span>XÂY DỰNG SÁNG KIẾN TỰ ĐỘNG</span><ArrowRight /></button>
            <button type="button" onClick={() => startWriting("guided")}><FileText size={25} /> <span>XÂY DỰNG THEO TỪNG BƯỚC</span><ArrowRight /></button>
          </div>
        </section>

        <section className="workspace" id="workspace" ref={workRef} aria-live="polite">
          {stage === "loading" && (
            <div className="loading-card">
              <div className="brain-ring"><Bot size={38} /></div>
              <span><Sparkles size={15} /> TRỢ LÝ SÁNG KIẾN ĐANG XỬ LÝ...</span>
              <h2>{phaseMeta[phase].loading}</h2>
              <p>Vui lòng đợi trong giây lát, trợ lý sáng kiến đang soạn thảo văn bản...</p>
              <Progress value={progress} className="generation-progress" />
              <small>Bước {phase + 1}/6 · {mode === "automatic" ? "Tự động" : "Từng bước"}</small>
            </div>
          )}

          {stage === "review" && (
            <div className="review-card">
              <div className="review-head">
                <div><h2>{phaseMeta[phase].label}</h2><p>Bạn có thể chỉnh sửa trực tiếp nội dung AI gợi ý bên dưới.</p></div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="review-tabs">
                  <TabsList>
                    <TabsTrigger value="edit"><PencilLine size={15} /> SOẠN THẢO</TabsTrigger>
                    <TabsTrigger value="preview"><FileText size={15} /> XEM TRƯỚC</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="content-tabs">
                <TabsContent value="edit" className="editor-pane">
                  <label htmlFor="draft-editor" className="sr-only">Nội dung phần đang soạn thảo</label>
                  <textarea id="draft-editor" value={drafts[phase]} onChange={(event) => setDrafts((current) => current.map((text, index) => index === phase ? event.target.value : text))} />
                </TabsContent>
                <TabsContent value="preview" className="preview-pane">
                  <PlainDocument content={drafts[phase]} />
                </TabsContent>
              </Tabs>
              <div className="review-actions">
                <div className="secondary-actions">
                  <button type="button" onClick={() => copyText(drafts[phase])}><Clipboard size={16} /> SAO CHÉP MỤC NÀY</button>
                  <button type="button" disabled title="Chức năng đang khóa"><LockKeyhole size={16} /> XUẤT BẢN NHÁP</button>
                  <button type="button" className="rewrite" onClick={rewriteSection}><RefreshCcw size={16} /> VIẾT LẠI MỤC NÀY</button>
                </div>
                <button className="continue-button" type="button" onClick={continueWriting}>{phase === 5 ? "HOÀN TẤT SÁNG KIẾN" : "HOÀN THÀNH & TIẾP TỤC"} <ArrowRight size={20} /></button>
              </div>
            </div>
          )}

          {stage === "complete" && (
            <div className="final-preview">
              <div className="window-bar"><span /><span /><span /><b>BẢN XEM TRƯỚC NỘI DUNG SÁNG KIẾN</b></div>
              <div className="final-document">
                <h1>{profile.title.toUpperCase()}</h1>
                <h2>Trọng tâm: {profile.focus}</h2>
                {drafts.slice(0, 5).map((content, index) => <PlainDocument key={index} content={content} compact />)}
                <div className="completion-stamp"><Check size={18} /> Hoàn thành 6/6 phần</div>
              </div>
              <p className="scroll-note">SỬ DỤNG THANH CUỘN BÊN PHẢI ĐỂ XEM TOÀN BỘ NỘI DUNG</p>
            </div>
          )}
        </section>

        <AssistantCard />
      </div>

      <Sheet>
        <SheetTrigger asChild><button className="floating-menu" aria-label="Mở trình đơn" type="button"><Menu size={27} /></button></SheetTrigger>
        <SheetContent side="bottom" className="menu-sheet">
          <SheetHeader><SheetTitle>Trợ lý Sáng kiến</SheetTitle><SheetDescription>Di chuyển nhanh trong nội dung đang làm.</SheetDescription></SheetHeader>
          <nav>
            <SheetClose asChild><button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}><GraduationCap /> Hồ sơ sáng kiến</button></SheetClose>
            {stage !== "form" && <SheetClose asChild><button type="button" onClick={() => workRef.current?.scrollIntoView({ behavior: "smooth" })}><ListChecks /> Tiến trình hiện tại</button></SheetClose>}
            <SheetClose asChild><button type="button" onClick={() => document.getElementById("assistant-info")?.scrollIntoView({ behavior: "smooth" })}><Lightbulb /> Thông tin trợ lý</button></SheetClose>
            {stage !== "form" && <SheetClose asChild><button type="button" className="reset-button" onClick={reset}><RefreshCcw /> Tạo hồ sơ mới</button></SheetClose>}
          </nav>
        </SheetContent>
      </Sheet>
      <Toaster position="top-center" richColors />
    </main>
  );
}
