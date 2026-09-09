"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Bot, BriefcaseBusiness, CalendarDays, Check,
  CheckCircle2, Clipboard, Download, FileCheck2, FileText, GraduationCap,
  Lightbulb, ListChecks, MapPin, Menu, PencilLine, Printer, RefreshCcw,
  Save, School, ShieldCheck, Sparkles, Target, Trash2, Upload, UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader,
  SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";

type Profile = {
  author: string; school: string; subject: string; level: string; grade: string;
  title: string; focus: string; audience: string; region: string; year: string;
  textbook: string; duration: string; facilities: string; technology: string;
  novelty: string;
};

type Requirements = {
  solutionCount: number; pageTarget: string; realExamples: boolean;
  statistics: boolean; notes: string; referenceNotes: string;
};

type FileMeta = { id: string; name: string; size: number; type: string; excerpt?: string };
type FieldKey = keyof Profile;
type Stage = "form" | "loading" | "review" | "complete";
type Mode = "automatic" | "guided";

const STORAGE_KEY = "tro-ly-sang-kien-v4.3";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE = /\.(pdf|doc|docx|txt)$/i;

const emptyProfile: Profile = {
  author: "", school: "", subject: "", level: "", grade: "", title: "",
  focus: "", audience: "", region: "", year: "", textbook: "", duration: "",
  facilities: "", technology: "", novelty: "",
};

const emptyRequirements: Requirements = {
  solutionCount: 3, pageTarget: "", realExamples: true, statistics: false,
  notes: "", referenceNotes: "",
};

const fields: Array<{
  key: FieldKey; label: string; placeholder: string; color: string;
  icon: typeof UserRound; required?: boolean; multiline?: boolean;
}> = [
  { key: "author", label: "Họ và tên người viết", placeholder: "VD: Nguyễn Văn A", color: "#f0640a", icon: UserRound, required: true },
  { key: "school", label: "Đơn vị công tác", placeholder: "VD: Trường THCS Nguyễn Du", color: "#9446e8", icon: School, required: true },
  { key: "subject", label: "Môn học / Lĩnh vực", placeholder: "VD: Khoa học tự nhiên", color: "#0eaac4", icon: BriefcaseBusiness, required: true },
  { key: "level", label: "Cấp học", placeholder: "VD: THCS", color: "#2e72d2", icon: GraduationCap, required: true },
  { key: "grade", label: "Khối lớp", placeholder: "VD: Lớp 9", color: "#6b55d9", icon: UsersRound },
  { key: "title", label: "Tên đề tài sáng kiến", placeholder: "VD: Nâng cao năng lực tự học môn KHTN...", color: "#e94c12", icon: FileText, required: true, multiline: true },
  { key: "focus", label: "Nội dung trọng tâm", placeholder: "Nêu ngắn gọn vấn đề và hướng tác động", color: "#f29b05", icon: Target, required: true, multiline: true },
  { key: "audience", label: "Đối tượng nghiên cứu", placeholder: "VD: 45 học sinh lớp 9A", color: "#565ee8", icon: UsersRound, required: true, multiline: true },
  { key: "region", label: "Địa điểm (Huyện, Tỉnh)", placeholder: "VD: Hòa Thành, Tây Ninh", color: "#18b375", icon: MapPin, required: true },
  { key: "year", label: "Năm học", placeholder: "VD: 2026–2027", color: "#ef315e", icon: CalendarDays, required: true },
  { key: "textbook", label: "Sách giáo khoa", placeholder: "VD: Kết nối tri thức", color: "#a45f14", icon: BookOpen },
  { key: "duration", label: "Thời gian thực hiện", placeholder: "VD: Từ 9/2026 đến 3/2027", color: "#a54178", icon: CalendarDays },
  { key: "facilities", label: "Điều kiện cơ sở vật chất", placeholder: "VD: Phòng máy, máy chiếu, Wi‑Fi", color: "#0b8c8f", icon: School, multiline: true },
  { key: "technology", label: "Công nghệ / Công cụ áp dụng", placeholder: "VD: LMS, Canva, ChatGPT...", color: "#7f53ca", icon: Bot },
  { key: "novelty", label: "Điểm mới / Trọng tâm đề tài", placeholder: "Nêu điểm khác biệt so với cách làm cũ", color: "#d96716", icon: Lightbulb, multiline: true },
];

const phaseMeta = [
  { label: "Phần I: Mở đầu", loading: "Đang xây dựng mục tiêu và phạm vi..." },
  { label: "Phần II: Cơ sở lý luận & Thực trạng", loading: "Đang hệ thống hóa thực trạng..." },
  { label: "Phần III: Các giải pháp", loading: "Đang sắp xếp hệ thống giải pháp..." },
  { label: "Phần IV: Kết quả", loading: "Đang tạo khung minh chứng và khảo nghiệm..." },
  { label: "Phần V: Kết luận & Kiến nghị", loading: "Đang hoàn thiện kết luận..." },
  { label: "Phần VI: Phụ lục & Tài liệu", loading: "Đang lập danh mục tài liệu..." },
] as const;

function buildSections(profile: Profile, requirements: Requirements, template: FileMeta | null, references: FileMeta[]): string[] {
  const p = profile;
  const context = [p.grade, p.level].filter(Boolean).join(", ");
  const solutions = [
    `## 1. XÁC ĐỊNH MỤC TIÊU VÀ TIÊU CHÍ ĐÁNH GIÁ\n\nGiáo viên cụ thể hóa yêu cầu cần đạt của môn ${p.subject}, xác định biểu hiện tiến bộ và xây dựng tiêu chí đánh giá phù hợp với ${p.audience}.`,
    `## 2. THIẾT KẾ HỌC LIỆU PHÂN HÓA\n\nHọc liệu được chia theo mức độ nhận biết, thông hiểu và vận dụng. Mỗi nhiệm vụ có hướng dẫn, sản phẩm cần đạt và phương án hỗ trợ riêng cho từng nhóm học sinh.`,
    `## 3. TỔ CHỨC HOẠT ĐỘNG HỌC TẬP\n\nGiáo viên tổ chức chuỗi hoạt động từ tình huống thực tiễn, nhiệm vụ cá nhân hoặc nhóm, thảo luận, phản biện đến tự đánh giá. Nội dung ưu tiên bối cảnh gần gũi với học sinh tại ${p.region}.`,
    `## 4. ỨNG DỤNG CÔNG NGHỆ CÓ KIỂM SOÁT\n\n${p.technology ? `Các công cụ ${p.technology} được sử dụng` : "Công nghệ được lựa chọn"} để chuẩn bị học liệu, hỗ trợ phản hồi và theo dõi tiến bộ. Giáo viên chịu trách nhiệm kiểm tra độ chính xác, bản quyền và mức độ phù hợp trước khi sử dụng.`,
    `## 5. THEO DÕI VÀ ĐIỀU CHỈNH\n\nKết quả học tập được ghi nhận theo từng giai đoạn. Giáo viên dùng phiếu quan sát, sản phẩm học tập và bài kiểm tra ngắn để điều chỉnh nhiệm vụ, tránh đánh giá chỉ dựa trên một thời điểm.`,
    `## 6. PHỐI HỢP VÀ NHÂN RỘNG\n\nTổ chuyên môn cùng rà soát học liệu, chia sẻ minh chứng và thống nhất cách đánh giá. Giải pháp được điều chỉnh trước khi mở rộng sang lớp hoặc đơn vị có điều kiện tương đương.`,
  ].slice(0, requirements.solutionCount).join("\n\n");

  let resultSectionIndex = 2;
  const resultEvidence = [
    requirements.realExamples ? `## ${resultSectionIndex++}. VÍ DỤ MINH HỌA\n\nMột hoạt động minh họa cần nêu rõ yêu cầu cần đạt, nhiệm vụ của học sinh, sản phẩm, tiêu chí đánh giá và phản hồi của giáo viên. Giáo viên bổ sung ví dụ thật đã triển khai với ${p.audience} trước khi nộp hồ sơ.` : "",
    requirements.statistics ? `## ${resultSectionIndex++}. KHUNG SỐ LIỆU TRƯỚC – SAU\n\n- Sĩ số và số học sinh tham gia: [bổ sung số liệu thực tế].\n- Tỷ lệ hoàn thành trước áp dụng: [bổ sung].\n- Tỷ lệ hoàn thành sau áp dụng: [bổ sung].\n- Chênh lệch và nhận xét: [bổ sung].\n\nKhông tự suy diễn số liệu. Chỉ điền số liệu có phiếu khảo sát, bảng điểm hoặc minh chứng kèm theo.` : "",
  ].filter(Boolean).join("\n\n");

  const referenceList = references.length
    ? references.map((file, index) => `- ${index + 1}. ${file.name}`).join("\n")
    : "- Chưa đính kèm tài liệu tham khảo; giáo viên cần bổ sung nguồn đã sử dụng.";

  return [
    `# I. PHẦN MỞ ĐẦU\n\n## 1. LÝ DO CHỌN ĐỀ TÀI\n\nTrong bối cảnh triển khai Chương trình Giáo dục phổ thông 2018, việc “${p.title}” có ý nghĩa thiết thực đối với ${p.audience} tại ${p.school}. Trọng tâm “${p.focus}” hướng tới nâng cao mức độ chủ động, chất lượng học tập và khả năng vận dụng kiến thức của người học.\n\n## 2. MỤC ĐÍCH NGHIÊN CỨU\n\n- Xây dựng quy trình phù hợp với ${p.audience}.\n- Cải thiện hiệu quả tổ chức dạy học môn ${p.subject}.\n- Đánh giá tính khả thi trong điều kiện thực tế tại ${p.school}, ${p.region}.\n\n## 3. ĐỐI TƯỢNG VÀ PHẠM VI\n\nĐối tượng nghiên cứu là ${p.audience}${context ? ` (${context})` : ""} trong năm học ${p.year}. Nội dung tập trung vào ${p.focus.toLowerCase()}.\n\n## 4. PHƯƠNG PHÁP NGHIÊN CỨU\n\n- Nghiên cứu chương trình, tài liệu chuyên môn và học liệu liên quan.\n- Điều tra, quan sát, trao đổi với học sinh và đồng nghiệp.\n- Thực nghiệm sư phạm, đối chiếu kết quả trước và sau áp dụng.\n- Thống kê, phân tích minh chứng và rút ra kết luận.`,
    `# II. CƠ SỞ LÝ LUẬN VÀ THỰC TRẠNG\n\n## 1. CƠ SỞ LÝ LUẬN\n\nChương trình GDPT 2018 định hướng phát triển phẩm chất và năng lực. Hoạt động dạy học ${p.subject} cần tạo cơ hội để người học khám phá, hợp tác, giải quyết vấn đề và vận dụng kiến thức trong bối cảnh thực tế.\n\n${p.textbook ? `Nội dung triển khai được đối chiếu với sách giáo khoa ${p.textbook}.` : "Nội dung triển khai cần được đối chiếu với sách giáo khoa và hướng dẫn chuyên môn đang áp dụng."}\n\n## 2. THỰC TRẠNG TRƯỚC KHI ÁP DỤNG\n\n${p.school} đã quan tâm đến đổi mới phương pháp dạy học. Tuy nhiên, mức độ tiếp thu của học sinh chưa đồng đều; việc thiết kế nhiệm vụ phân hóa và theo dõi tiến bộ còn cần nhiều thời gian.\n\n${p.facilities ? `Điều kiện hiện có: ${p.facilities}.` : "Giáo viên cần mô tả cụ thể điều kiện cơ sở vật chất và học liệu hiện có."}\n\n## 3. NGUYÊN NHÂN\n\n- Năng lực và nhịp độ học tập giữa các học sinh có sự khác biệt.\n- Học liệu phân hóa chưa được tổ chức thành hệ thống.\n- Minh chứng theo dõi tiến bộ chưa được chuẩn hóa.\n\n## 4. ĐIỂM MỚI DỰ KIẾN\n\n${p.novelty || "Giáo viên cần bổ sung điểm mới, chỉ rõ sự khác biệt với cách làm trước đây và điều kiện để áp dụng."}`,
    `# III. CÁC GIẢI PHÁP THỰC HIỆN\n\n${solutions}\n\n## NGUYÊN TẮC TRIỂN KHAI\n\nMỗi giải pháp cần gắn với một vấn đề thực trạng, có người thực hiện, thời gian, công cụ, sản phẩm và minh chứng kiểm tra. ${requirements.notes ? `Yêu cầu bổ sung của người viết: ${requirements.notes}` : ""}`,
    `# IV. KẾT QUẢ ĐẠT ĐƯỢC\n\n## 1. KHUNG ĐÁNH GIÁ KẾT QUẢ\n\nKết quả của sáng kiến cần được đánh giá trên các nhóm minh chứng: mức độ tham gia, chất lượng sản phẩm học tập, kết quả kiểm tra, phản hồi của học sinh và khả năng áp dụng của giáo viên.\n\nKhông sử dụng số liệu ước đoán. Mọi tỷ lệ, bảng biểu và nhận xét định lượng phải đối chiếu với hồ sơ thực tế.\n\n${resultEvidence || "Giáo viên bổ sung minh chứng, ví dụ thực tế hoặc số liệu khảo nghiệm phù hợp với hồ sơ của đơn vị."}\n\n## ${resultSectionIndex}. KHẢ NĂNG ÁP DỤNG\n\nGiải pháp có thể điều chỉnh để áp dụng cho các lớp khác trong ${p.school} hoặc các đơn vị có điều kiện tương đương.`,
    `# V. KẾT LUẬN VÀ KIẾN NGHỊ\n\n## 1. KẾT LUẬN\n\nSáng kiến “${p.title}” tập trung giải quyết vấn đề ${p.focus.toLowerCase()} trong dạy học ${p.subject}. Giá trị của sáng kiến cần được chứng minh bằng quá trình triển khai, sản phẩm và số liệu thực tế.\n\n## 2. KIẾN NGHỊ\n\n- Nhà trường tạo điều kiện về thiết bị, học liệu và sinh hoạt chuyên môn.\n- Tổ chuyên môn xây dựng kho học liệu dùng chung và quy trình kiểm tra chất lượng.\n- Giáo viên tiếp tục rà soát, thử nghiệm và cập nhật minh chứng trong các năm học sau.`,
    `# VI. PHỤ LỤC VÀ TÀI LIỆU THAM KHẢO\n\n## 1. THÔNG TIN HỒ SƠ\n\n- Tác giả: ${p.author}.\n- Đơn vị: ${p.school}.\n- Lĩnh vực: ${p.subject}.\n- Năm học: ${p.year}.\n- Thời gian thực hiện: ${p.duration || "[bổ sung]"}.\n- Mẫu yêu cầu: ${template?.name || "Chưa đính kèm"}.\n- Mục tiêu độ dài: ${requirements.pageTarget ? `${requirements.pageTarget} trang` : "Không giới hạn"}.\n\n## 2. DANH MỤC TÀI LIỆU ĐÃ ĐÍNH KÈM\n\n${referenceList}\n\n${requirements.referenceNotes ? `## 3. GHI CHÚ TỪ TÀI LIỆU\n\n${requirements.referenceNotes}` : "## 3. GHI CHÚ\n\nTên tệp được ghi nhận để quản lý hồ sơ. Giáo viên cần đối chiếu nội dung và hoàn thiện trích dẫn trước khi nộp."}\n\n## 4. CAM KẾT\n\nTôi cam đoan các thông tin, số liệu và minh chứng trong hồ sơ đã được kiểm tra; chịu trách nhiệm về tính chính xác và quyền sử dụng tài liệu.\n\n${p.region}, năm ${p.year.slice(0, 4)}\n\nNGƯỜI VIẾT SÁNG KIẾN\n\n${p.author}`,
  ];
}

function rewriteDraftText(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/có ý nghĩa thiết thực/g, "đáp ứng yêu cầu thực tiễn"],
    [/tập trung giải quyết/g, "hướng đến xử lý"],
    [/được đánh giá/g, "được xem xét"],
    [/có thể điều chỉnh/g, "có khả năng điều chỉnh"],
    [/cần được/g, "nên được"],
  ];
  return replacements.reduce((result, [pattern, value]) => result.replace(pattern, value), text);
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function contentToHtml(content: string) {
  return content.split("\n").map((raw) => {
    const line = raw.trim();
    if (!line) return "<div style='height:8px'></div>";
    if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
    if (line.startsWith("- ")) return `<p style='margin-left:18px'>• ${escapeHtml(line.slice(2))}</p>`;
    return `<p>${escapeHtml(line)}</p>`;
  }).join("");
}

function createWordDataUrl(contents: string[], title: string) {
  const documentTitle = title || "Sáng kiến giáo dục";
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:2cm}h1{text-align:center;font-size:18pt}h2{font-size:15pt;margin-top:20px}p{text-align:justify;margin:8px 0}</style></head><body><h1>${escapeHtml(documentTitle.toUpperCase())}</h1>${contents.map(contentToHtml).join("")}</body></html>`;
  return `data:application/msword;charset=utf-8,${encodeURIComponent(`\ufeff${html}`)}`;
}

function PlainDocument({ content, compact = false }: { content: string; compact?: boolean }) {
  return <div className={compact ? "document compact" : "document"}>{content.split("\n").map((raw, index) => {
    const line = raw.trim();
    if (!line) return <div className="doc-space" key={index} />;
    if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
    if (line.startsWith("## ")) return <h3 key={index}>{line.slice(3)}</h3>;
    if (line.startsWith("### ")) return <h4 key={index}>{line.slice(4)}</h4>;
    if (line.startsWith("- ")) return <li key={index}>{line.slice(2)}</li>;
    return <p key={index}>{line}</p>;
  })}</div>;
}

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function UploadPanel({ title, hint, files, multiple, onFiles, onRemove }: {
  title: string; hint: string; files: FileMeta[]; multiple?: boolean;
  onFiles: (files: FileList | null) => void; onRemove: (id: string) => void;
}) {
  return <div className="upload-panel">
    <div className="upload-copy"><FileCheck2 size={25} /><div><strong>{title}</strong><span>{hint}</span></div></div>
    <label className="upload-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFiles(event.dataTransfer.files); }}><Upload size={23} /><span>Kéo thả hoặc <b>chọn tệp</b></span><small>PDF, Word, TXT · tối đa 10 MB/tệp</small><input type="file" accept=".pdf,.doc,.docx,.txt" multiple={multiple} onChange={(event) => { onFiles(event.target.files); event.target.value = ""; }} /></label>
    {files.length > 0 && <div className="file-list">{files.map((file) => <div className="file-row" key={file.id}><FileText size={18} /><span><b>{file.name}</b><small>{formatFileSize(file.size)}</small></span><button type="button" aria-label={`Xóa ${file.name}`} onClick={() => onRemove(file.id)}><Trash2 size={16} /></button></div>)}</div>}
    <p className="privacy-note"><ShieldCheck size={15} /> Lưu danh mục tệp trên thiết bị; TXT được đọc tối đa 3.000 ký tự. Với PDF/Word, hãy dán nội dung cần dùng vào ghi chú.</p>
  </div>;
}

function AssistantCard() {
  return <aside className="assistant-card" id="assistant-info">
    <div className="assistant-title-row"><div className="assistant-icon"><BookOpen size={24} /></div><div><h2>TRỢ LÝ SÁNG KIẾN VIP - GDPT 2018</h2><p>Soạn thảo có kiểm soát, không tự bịa số liệu khảo nghiệm</p></div></div>
    <div className="assistant-badges"><span>Phiên bản v4.4</span><span><ShieldCheck size={14} /> Xử lý cục bộ</span></div>
    <div className="assistant-rule" />
    <div className="info-box"><span className="info-label"><UserRound size={16} /> THÔNG TIN PHÁT TRIỂN</span><strong>Phát triển bởi Anh giáo PHẠM QUỐC ĐẠT</strong><p>Giáo viên cần kiểm tra nội dung, số liệu và tài liệu dẫn trước khi nộp.</p></div>
    <footer>© 2026 · Phát triển bởi Anh giáo PHẠM QUỐC ĐẠT</footer>
  </aside>;
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [requirements, setRequirements] = useState<Requirements>(emptyRequirements);
  const [template, setTemplate] = useState<FileMeta | null>(null);
  const [references, setReferences] = useState<FileMeta[]>([]);
  const [stage, setStage] = useState<Stage>("form");
  const [mode, setMode] = useState<Mode>("automatic");
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("preview");
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { profile?: Profile; requirements?: Requirements; template?: FileMeta | null; references?: FileMeta[]; drafts?: string[] };
          if (parsed.profile) setProfile({ ...emptyProfile, ...parsed.profile });
          if (parsed.requirements) setRequirements({ ...emptyRequirements, ...parsed.requirements });
          if (parsed.template) setTemplate(parsed.template);
          if (Array.isArray(parsed.references)) setReferences(parsed.references);
          if (Array.isArray(parsed.drafts)) setDrafts(parsed.drafts);
          setSavedAt(Date.now());
        }
      } catch {
        try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, requirements, template, references, drafts })); setSavedAt(Date.now()); setSaveError(false); } catch { setSaveError(true); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [drafts, hydrated, profile, references, requirements, template]);

  useEffect(() => {
    if (stage !== "loading") return;
    const interval = window.setInterval(() => setProgress((value) => Math.min(value + Math.ceil((96 - value) / 4), 96)), 100);
    const timer = window.setTimeout(() => {
      window.clearInterval(interval);
      setProgress(100);
      if (mode === "automatic") {
        if (phase < phaseMeta.length - 1) { setPhase((current) => current + 1); setProgress(8); }
        else { setStage("complete"); toast.success("Đã hoàn thiện 6 phần nội dung."); }
      } else { setStage("review"); setActiveTab("preview"); }
    }, mode === "automatic" ? 520 : 900);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, [mode, phase, stage]);

  useEffect(() => {
    if (stage === "form") return;
    const timer = window.setTimeout(() => workRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const requiredComplete = useMemo(() => fields.filter((field) => field.required).every((field) => profile[field.key].trim()), [profile]);
  const completion = [Boolean(template), requiredComplete, references.length > 0 || requirements.referenceNotes.trim().length > 0, true];
  const updateField = (key: FieldKey, value: string) => setProfile((current) => ({ ...current, [key]: value }));

  const readFiles = async (fileList: FileList | null, kind: "template" | "reference") => {
    if (!fileList?.length) return;
    const accepted: FileMeta[] = [];
    for (const file of Array.from(fileList)) {
      if (!ALLOWED_FILE.test(file.name)) { toast.error(`${file.name}: chỉ hỗ trợ PDF, Word hoặc TXT.`); continue; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: dung lượng vượt quá 10 MB.`); continue; }
      const excerpt = file.name.toLowerCase().endsWith(".txt") ? (await file.text()).slice(0, 3000) : undefined;
      accepted.push({ id: `${file.name}-${file.lastModified}-${file.size}`, name: file.name, size: file.size, type: file.type, excerpt });
    }
    if (!accepted.length) return;
    if (kind === "template") setTemplate(accepted[0]);
    else setReferences((current) => [...current, ...accepted].filter((file, index, all) => all.findIndex((candidate) => candidate.id === file.id) === index).slice(0, 6));
    toast.success(kind === "template" ? "Đã ghi nhận mẫu yêu cầu." : "Đã thêm tài liệu tham khảo.");
  };

  const startWriting = (selectedMode: Mode) => {
    const missing = fields.find((field) => field.required && !profile[field.key].trim());
    if (missing) { toast.error(`Vui lòng nhập ${missing.label.toLowerCase()}.`); document.getElementById(`field-${missing.key}`)?.focus(); return; }
    if (drafts.length && !window.confirm("Tạo lại nội dung sẽ thay thế bản nháp đang có. Thầy/cô đã tải bản sao và muốn tiếp tục?")) return;
    setMode(selectedMode); setDrafts(buildSections(profile, requirements, template, references)); setPhase(0); setProgress(8); setStage("loading");
  };

  const continueWriting = () => {
    if (phase === phaseMeta.length - 1) { setStage("complete"); toast.success("Đã hoàn thiện nội dung sáng kiến."); return; }
    setPhase((current) => current + 1); setProgress(8); setStage("loading");
  };

  const rewriteSection = () => {
    setDrafts((current) => current.map((text, index) => index === phase ? rewriteDraftText(text) : text));
    toast.success("Đã diễn đạt lại mục này. Hãy kiểm tra trước khi tiếp tục.");
  };

  const copyText = async (text: string, message = "Đã sao chép nội dung.") => {
    try { await navigator.clipboard.writeText(text.replace(/^#{1,3}\s/gm, "")); toast.success(message); }
    catch { toast.error("Không thể sao chép. Vui lòng thử lại."); }
  };

  const saveNow = () => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, requirements, template, references, drafts })); setSavedAt(Date.now()); setSaveError(false); toast.success("Đã lưu bản nháp trên thiết bị này."); } catch { setSaveError(true); toast.error("Không thể lưu trên thiết bị. Hãy tải bản sao hồ sơ."); }
  };

  const reset = () => {
    setProfile(emptyProfile); setRequirements(emptyRequirements); setTemplate(null); setReferences([]); setDrafts([]);
    setStage("form"); setPhase(0); setProgress(0); try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 50); toast.success("Đã tạo hồ sơ mới.");
  };

  return <main className="site-shell">
    <header className="topbar"><div className="topbar-inner">
      <div className="brand-lockup"><Sparkles size={22} /><span><b>SÁNG KIẾN VIP</b><small>GDPT 2018</small></span></div>
      <div className="header-actions"><span className="save-state"><CheckCircle2 size={15} /> {saveError ? "Chưa lưu được" : savedAt ? "Đã tự lưu" : "Bản nháp mới"}</span>
        <Dialog><DialogTrigger asChild><button className="guide-button" type="button"><BookOpen size={18} /> Hướng dẫn</button></DialogTrigger><DialogContent className="guide-dialog"><DialogHeader><DialogTitle>Quy trình xây dựng sáng kiến</DialogTitle><DialogDescription>Chuẩn bị hồ sơ, tạo nội dung và kiểm tra trước khi xuất bản.</DialogDescription></DialogHeader><ol><li>Tải mẫu yêu cầu của Sở/Phòng/đơn vị nếu có.</li><li>Nhập đủ thông tin bắt buộc; bổ sung dữ liệu càng cụ thể càng tốt.</li><li>Đính kèm danh mục tài liệu và chọn yêu cầu đầu ra.</li><li>Duyệt từng phần hoặc tạo nhanh toàn bộ, sau đó xuất Word/in PDF.</li></ol></DialogContent></Dialog>
      </div>
    </div></header>

    <div className="page-content">
      <section className="profile-section" id="profile" ref={formRef}>
        <div className="sunrise-hero">
          <div><p className="eyebrow">VÌ NHỮNG LỚP HỌC HẠNH PHÚC</p><h1>Trợ lý <span>Sáng kiến VIP</span></h1><p className="hero-lead">Mỗi sáng kiến là một bước tiến cho lớp học.</p><p>Chuẩn hóa hồ sơ, phát triển ý tưởng và soạn bản thảo có minh chứng cùng thầy, cô.</p>
          <div className="hero-actions"><button type="button" onClick={() => startWriting("automatic")}><Sparkles size={18} /> Tạo nhanh toàn bộ <ArrowRight size={18} /></button><button type="button" onClick={() => startWriting("guided")}><ListChecks size={18} /> Xây dựng từng bước</button></div>
          <div className="trust-row"><span><ShieldCheck size={16} /> Không tự bịa số liệu</span><span><Save size={16} /> Lưu nháp trên thiết bị</span><span><FileText size={16} /> Xuất Word chỉnh sửa</span></div></div>
          <aside className="welcome-note"><GraduationCap size={36} /><p>Xin chào, {profile.author || "thầy/cô"}!</p><h2>Ý tưởng hôm nay.<br />Thay đổi ngày mai.</h2><span>GDPT 2018 · Đồng hành cùng giáo viên</span></aside>
        </div>
        <nav className="setup-progress" aria-label="Tiến độ chuẩn bị hồ sơ">{["Mẫu yêu cầu", "Thông tin", "Tài liệu", "Đầu ra", "Soạn thảo", "Xem trước"].map((label, index) => <button type="button" className={(index < 4 ? completion[index] : index === 4 ? drafts.length > 0 : stage === "complete") ? "done" : ""} key={label} onClick={() => { if (index < 4) document.getElementById(`setup-${index}`)?.scrollIntoView({ behavior: "smooth" }); else if (drafts.length === 6) { setMode("guided"); setPhase(0); setStage(index === 5 ? "complete" : "review"); } else toast.info("Nhập hồ sơ và tạo nội dung để bắt đầu soạn thảo."); }}><span>{index + 1}</span><b>{label}</b></button>)}</nav>
        <div className="draft-dashboard"><div><Save size={22} /><span><b>{drafts.length ? "Bản nháp sẵn sàng tiếp tục" : "Bắt đầu từ ý tưởng của thầy, cô"}</b><small>{drafts.length ? `${drafts.length} phần đã tạo · ${drafts.join(" ").trim().split(/\s+/).length} từ` : "Điền thông tin bên dưới để xây dựng sáng kiến."}</small></span></div><div className="draft-actions">{drafts.length === 6 && <button type="button" onClick={() => { setMode("guided"); setStage("review"); }}>Tiếp tục soạn thảo <ArrowRight size={16} /></button>}<button type="button" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify({ profile, requirements, template, references, drafts }, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = "ho-so-sang-kien.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><Download size={16} /> Tải bản sao hồ sơ</button></div></div>
        {saveError && <p role="alert">Chưa lưu được trên thiết bị. Hãy tải bản sao hồ sơ để giữ nội dung.</p>}

        <section className="setup-card" id="setup-0"><div className="section-heading"><span>1</span><div><h2>Mẫu yêu cầu của đơn vị</h2><p>Không bắt buộc. Dùng để quản lý đúng mẫu Sở/Phòng/Trường đang áp dụng.</p></div></div><UploadPanel title="Tải mẫu yêu cầu sáng kiến" hint="Chọn một tệp mẫu chính thức" files={template ? [template] : []} onFiles={(files) => readFiles(files, "template")} onRemove={() => setTemplate(null)} /></section>

        <section className="setup-card" id="setup-1"><div className="section-heading"><span>2</span><div><h2>Thông tin sáng kiến</h2><p>Các mục có dấu * là bắt buộc.</p></div></div><div className="profile-grid">{fields.map((field) => {
          const Icon = field.icon;
          const common = { id: `field-${field.key}`, value: profile[field.key], placeholder: field.placeholder, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateField(field.key, event.target.value), required: field.required };
          return <label className={`field-card ${field.multiline ? "wide" : ""}`} style={{ "--field-color": field.color } as React.CSSProperties} key={field.key}><span><Icon size={20} /> {field.label} {field.required && <em>*</em>}</span>{field.multiline ? <textarea {...common} rows={3} /> : <input {...common} />}</label>;
        })}</div></section>

        <section className="setup-card" id="setup-2"><div className="section-heading"><span>3</span><div><h2>Tài liệu tham khảo</h2><p>Tối đa 6 tệp. Có thể bổ sung ghi chú hoặc trích dẫn quan trọng.</p></div></div><UploadPanel title="Tải tài liệu PDF/Word/TXT" hint="Sáng kiến cũ, tài liệu chuyên môn, đề kiểm tra, văn bản pháp lý..." files={references} multiple onFiles={(files) => readFiles(files, "reference")} onRemove={(id) => setReferences((current) => current.filter((file) => file.id !== id))} /><label className="plain-field"><span>Ghi chú từ tài liệu</span><textarea value={requirements.referenceNotes} onChange={(event) => setRequirements((current) => ({ ...current, referenceNotes: event.target.value }))} placeholder="Dán trích dẫn, yêu cầu cấu trúc hoặc nội dung cần bám sát..." rows={4} /></label></section>

        <section className="setup-card" id="setup-3"><div className="section-heading"><span>4</span><div><h2>Yêu cầu đầu ra</h2><p>Thiết lập độ chi tiết và nguyên tắc tạo nội dung.</p></div></div>
          <div className="requirements-grid"><label className="mini-field"><span>Số giải pháp</span><input type="number" min={2} max={6} value={requirements.solutionCount} onChange={(event) => setRequirements((current) => ({ ...current, solutionCount: Math.min(6, Math.max(2, Number(event.target.value) || 2)) }))} /></label><label className="mini-field"><span>Mục tiêu số trang</span><input inputMode="numeric" value={requirements.pageTarget} onChange={(event) => setRequirements((current) => ({ ...current, pageTarget: event.target.value.replace(/\D/g, "").slice(0, 2) }))} placeholder="VD: 20" /></label></div>
          <div className="check-list"><label><Checkbox checked={requirements.realExamples} onCheckedChange={(checked) => setRequirements((current) => ({ ...current, realExamples: checked === true }))} /><span><b>Thêm ví dụ minh họa</b><small>Tạo khung ví dụ để giáo viên điền tình huống thật.</small></span></label><label><Checkbox checked={requirements.statistics} onCheckedChange={(checked) => setRequirements((current) => ({ ...current, statistics: checked === true }))} /><span><b>Thêm khung số liệu trước – sau</b><small>Không tự bịa số liệu; chỉ tạo vị trí cần bổ sung minh chứng.</small></span></label></div>
          <label className="plain-field"><span>Yêu cầu bổ sung</span><textarea value={requirements.notes} onChange={(event) => setRequirements((current) => ({ ...current, notes: event.target.value }))} placeholder="VD: Viết gọn cơ sở lý luận; tập trung giải pháp có thể nhân rộng..." rows={4} /></label>
          <div className="save-panel"><div><Save size={19} /><span><b>Bản nháp tự động lưu trên thiết bị</b><small>Có thể quay lại tiếp tục mà không nhập lại.</small></span></div><button type="button" onClick={saveNow}>Lưu ngay</button></div>
          <div className="mode-actions"><button type="button" onClick={() => startWriting("automatic")}><Sparkles size={25} /><span><b>TẠO NHANH TOÀN BỘ</b><small>Hoàn thiện 6 phần và chuyển đến bản xem trước</small></span><ArrowRight /></button><button type="button" className="guided-button" onClick={() => startWriting("guided")}><FileText size={25} /><span><b>XÂY DỰNG THEO TỪNG BƯỚC</b><small>Duyệt và chỉnh sửa từng phần trước khi tiếp tục</small></span><ArrowRight /></button></div>
        </section>
      </section>

      <section className="workspace" id="workspace" ref={workRef} aria-live="polite">
        {stage === "loading" && <div className="loading-card"><div className="brain-ring"><Bot size={38} /></div><span><Sparkles size={15} /> ĐANG XÂY DỰNG NỘI DUNG...</span><h2>{phaseMeta[phase].loading}</h2><p>Hệ thống đang sắp xếp nội dung từ hồ sơ đã nhập. Không tạo số liệu giả.</p><Progress value={progress} className="generation-progress" /><small>Bước {phase + 1}/6 · {mode === "automatic" ? "Tạo nhanh" : "Từng bước"}</small></div>}
        {stage === "review" && drafts[phase] && <div className="review-card"><div className="review-head"><div><h2>{phaseMeta[phase].label}</h2><p>Chỉnh sửa trực tiếp hoặc xem trước nội dung.</p></div><Tabs value={activeTab} onValueChange={setActiveTab} className="review-tabs"><TabsList><TabsTrigger value="edit"><PencilLine size={15} /> SOẠN THẢO</TabsTrigger><TabsTrigger value="preview"><FileText size={15} /> XEM TRƯỚC</TabsTrigger></TabsList></Tabs></div><Tabs value={activeTab} onValueChange={setActiveTab} className="content-tabs"><TabsContent value="edit" className="editor-pane"><label htmlFor="draft-editor" className="sr-only">Nội dung phần đang soạn thảo</label><textarea id="draft-editor" value={drafts[phase]} onChange={(event) => setDrafts((current) => current.map((text, index) => index === phase ? event.target.value : text))} /></TabsContent><TabsContent value="preview" className="preview-pane"><PlainDocument content={drafts[phase]} /></TabsContent></Tabs><div className="review-actions"><div className="secondary-actions"><button type="button" onClick={() => copyText(drafts[phase])}><Clipboard size={16} /> SAO CHÉP</button><a href={createWordDataUrl([drafts[phase]], profile.title)} download={`sang-kien-phan-${phase + 1}.doc`} onClick={() => toast.success("Đã tạo tệp Word. Vui lòng kiểm tra định dạng trước khi nộp.")}><Download size={16} /> XUẤT WORD</a><button type="button" className="rewrite" onClick={rewriteSection}><RefreshCcw size={16} /> DIỄN ĐẠT LẠI</button></div><button className="continue-button" type="button" onClick={continueWriting}>{phase === 5 ? "HOÀN TẤT SÁNG KIẾN" : "HOÀN THÀNH & TIẾP TỤC"} <ArrowRight size={20} /></button></div></div>}
        {stage === "complete" && drafts.length === 6 && <div className="final-preview"><div className="window-bar"><span /><span /><span /><b>BẢN XEM TRƯỚC SÁNG KIẾN</b></div><div className="final-toolbar"><button type="button" onClick={() => copyText(drafts.join("\n\n"), "Đã sao chép toàn bộ sáng kiến.")}><Clipboard size={17} /> Sao chép</button><a href={createWordDataUrl(drafts, profile.title)} download="sang-kien-hoan-chinh.doc" onClick={() => toast.success("Đã tạo tệp Word. Vui lòng kiểm tra định dạng trước khi nộp.")}><Download size={17} /> Xuất Word</a><button type="button" onClick={() => window.print()}><Printer size={17} /> In / Lưu PDF</button><button type="button" onClick={() => { setMode("guided"); setPhase(0); setStage("review"); }}><PencilLine size={17} /> Sửa từng phần</button></div><div className="final-document" id="print-document"><h1>{profile.title.toUpperCase()}</h1><h2>Trọng tâm: {profile.focus}</h2>{drafts.map((content, index) => <PlainDocument key={index} content={content} compact />)}<div className="completion-stamp"><Check size={18} /> Hoàn thành 6/6 phần</div></div><p className="scroll-note">HÃY RÀ SOÁT SỐ LIỆU, MINH CHỨNG VÀ TRÍCH DẪN TRƯỚC KHI NỘP</p></div>}
      </section>
      <AssistantCard />
    </div>

    <Sheet><SheetTrigger asChild><button className="floating-menu" aria-label="Mở trình đơn" type="button"><Menu size={27} /></button></SheetTrigger><SheetContent side="bottom" className="menu-sheet"><SheetHeader><SheetTitle>Trợ lý Sáng kiến</SheetTitle><SheetDescription>Di chuyển nhanh trong hồ sơ đang làm.</SheetDescription></SheetHeader><nav><SheetClose asChild><button type="button" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}><GraduationCap /> Hồ sơ sáng kiến</button></SheetClose>{stage !== "form" && <SheetClose asChild><button type="button" onClick={() => workRef.current?.scrollIntoView({ behavior: "smooth" })}><ListChecks /> Nội dung đang làm</button></SheetClose>}<SheetClose asChild><button type="button" onClick={() => document.getElementById("assistant-info")?.scrollIntoView({ behavior: "smooth" })}><Lightbulb /> Thông tin trợ lý</button></SheetClose><AlertDialog><AlertDialogTrigger asChild><button type="button" className="reset-button"><RefreshCcw /> Tạo hồ sơ mới</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tạo hồ sơ mới?</AlertDialogTitle><AlertDialogDescription>Thông tin và bản nháp đang lưu trên thiết bị sẽ bị xóa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={reset}>Xóa và tạo mới</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></nav></SheetContent></Sheet>
    <Toaster position="top-center" richColors />
  </main>;
}
