"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Bot, BriefcaseBusiness, CalendarDays, Check,
  CheckCircle2, Clipboard, Download, FileText, GraduationCap,
  Lightbulb, ListChecks, MapPin, PencilLine, Printer,
  School, ShieldCheck, Sparkles, Target, Upload, UserRound,
  UsersRound, KeyRound, LoaderCircle, Eye, EyeOff, RotateCcw, Award,
  SlidersHorizontal, HelpCircle, FileSignature
} from "lucide-react";
import { toast, Toaster } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { SAMPLE_SKKN_FIXTURES, type SampleFixture } from "@/lib/sample-skkn-fixtures";
import { generateDocxBlob } from "@/lib/docx-export";

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

type FieldKey = keyof Profile;
type Stage = "form" | "loading" | "review" | "complete";
type AppTab = "write" | "evaluate";

const STORAGE_KEY = "tro-ly-sang-kien-v5.0";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE = /\.(pdf|doc|docx|txt|png|jpe?g|webp)$/i;

const emptyProfile: Profile = {
  author: "", school: "", subject: "Khoa học tự nhiên", level: "THCS", grade: "Lớp 8",
  title: "", focus: "", audience: "", region: "", year: "2026 - 2027",
  textbook: "Kết nối tri thức với cuộc sống", duration: "", facilities: "",
  technology: "", novelty: "",
};

const emptyRequirements: Requirements = {
  solutionCount: 3, pageTarget: "15 - 20", realExamples: true, statistics: true,
  notes: "", referenceNotes: "",
};

const fields: Array<{
  key: FieldKey; label: string; placeholder: string; color: string;
  icon: typeof UserRound; required?: boolean; multiline?: boolean;
}> = [
  { key: "author", label: "Họ và tên người viết", placeholder: "VD: Nguyễn Văn An", color: "#f0640a", icon: UserRound, required: true },
  { key: "school", label: "Đơn vị công tác", placeholder: "VD: Trường THCS Nguyễn Du", color: "#9446e8", icon: School, required: true },
  { key: "subject", label: "Môn học / Lĩnh vực", placeholder: "VD: Khoa học tự nhiên", color: "#0eaac4", icon: BriefcaseBusiness, required: true },
  { key: "level", label: "Cấp học", placeholder: "VD: THCS", color: "#2e72d2", icon: GraduationCap, required: true },
  { key: "grade", label: "Khối lớp", placeholder: "VD: Lớp 8", color: "#6b55d9", icon: UsersRound },
  { key: "title", label: "Tên đề tài sáng kiến", placeholder: "VD: Nâng cao năng lực tự học môn KHTN...", color: "#e94c12", icon: FileText, required: true, multiline: true },
  { key: "focus", label: "Nội dung trọng tâm", placeholder: "Nêu ngắn gọn vấn đề và hướng tác động chính", color: "#f29b05", icon: Target, required: true, multiline: true },
  { key: "audience", label: "Đối tượng nghiên cứu", placeholder: "VD: 85 học sinh khối 8 (2 lớp)", color: "#565ee8", icon: UsersRound, required: true, multiline: true },
  { key: "region", label: "Địa bàn (Huyện, Tỉnh)", placeholder: "VD: Hòa Thành, Tây Ninh", color: "#18b375", icon: MapPin, required: true },
  { key: "year", label: "Năm học", placeholder: "VD: 2026 - 2027", color: "#ef315e", icon: CalendarDays, required: true },
  { key: "textbook", label: "Bộ sách giáo khoa", placeholder: "VD: Kết nối tri thức", color: "#a45f14", icon: BookOpen },
  { key: "duration", label: "Thời gian thực hiện", placeholder: "VD: Từ 9/2026 đến 3/2027", color: "#a54178", icon: CalendarDays },
  { key: "facilities", label: "Điều kiện cơ sở vật chất", placeholder: "VD: Phòng máy tính, máy chiếu, kết nối Internet", color: "#0b8c8f", icon: School, multiline: true },
  { key: "technology", label: "Công nghệ / Công cụ áp dụng", placeholder: "VD: Google Classroom, Canva, Edpuzzle, ChatGPT...", color: "#7f53ca", icon: Bot },
  { key: "novelty", label: "Điểm mới / Trọng tâm sáng kiến", placeholder: "Nêu điểm khác biệt đột phá so với cách làm truyền thống", color: "#d96716", icon: Lightbulb, multiline: true },
];

const phaseMeta = [
  { label: "Phần I: Mở đầu", loading: "Đang xây dựng lý do, mục tiêu và phương pháp nghiên cứu..." },
  { label: "Phần II: Cơ sở lý luận & Thực trạng", loading: "Đang hệ thống hóa cơ sở khoa học và khảo sát thực trạng..." },
  { label: "Phần III: Các biện pháp giải quyết", loading: "Đang thiết lập quy trình giải pháp và ví dụ minh họa..." },
  { label: "Phần IV: Kết quả thực nghiệm", loading: "Đang xây dựng bảng số liệu đối chứng và phân tích năng lực..." },
  { label: "Phần V: Kết luận & Kiến nghị", loading: "Đang hoàn thiện kết luận, bài học kinh nghiệm và kiến nghị..." },
  { label: "Phần VI: Phụ lục & Tài liệu tham khảo", loading: "Đang chuẩn hóa danh mục tài liệu tham khảo và phụ lục..." },
] as const;

export default function Home() {
  const [appTab, setAppTab] = useState<AppTab>("write");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [requirements, setRequirements] = useState<Requirements>(emptyRequirements);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("form");
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // AI settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [model, setModel] = useState("gemini-3.8-flash");
  const [models, setModels] = useState<string[]>([]);
  const [checkingKey, setCheckingKey] = useState(false);

  // Rewriting section
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [revisionPrompt, setRevisionPrompt] = useState("");

  // Evaluation Studio
  const [evalDocText, setEvalDocText] = useState("");
  const [evalTitle, setEvalTitle] = useState("");
  const [evalSubject, setEvalSubject] = useState("");
  const [evalBusy, setEvalBusy] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const workRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evalFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedKey = sessionStorage.getItem("gemini_session_key");
      if (savedKey) {
        setApiKey(savedKey);
        setRememberSession(true);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.profile) setProfile({ ...emptyProfile, ...parsed.profile });
        if (parsed.requirements) setRequirements({ ...emptyRequirements, ...parsed.requirements });
        if (Array.isArray(parsed.drafts) && parsed.drafts.length === 6) setDrafts(parsed.drafts);
      }
    } catch {
      /* Storage may be unavailable */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, requirements, drafts }));
      } catch {
        /* LocalStorage quota */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [drafts, hydrated, profile, requirements]);

  const loadSample = (fixture: SampleFixture) => {
    setProfile(fixture.profile);
    toast.success(`Đã nạp hồ sơ mẫu: ${fixture.name}`);
  };

  const loadEvalSample = (fixture: SampleFixture) => {
    setEvalTitle(fixture.profile.title);
    setEvalSubject(fixture.profile.subject);
    setEvalDocText(fixture.sampleDocument);
    toast.success(`Đã nạp đề tài mẫu thẩm định: ${fixture.name}`);
  };

  const checkAiConnection = async () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) return toast.error("Vui lòng nhập API Key để kiểm tra.");
    setCheckingKey(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể kết nối API Key.");
      setModels(data.models || []);
      if (data.models?.length && !data.models.includes(model)) {
        setModel(data.models[0]);
      }
      if (rememberSession) {
        sessionStorage.setItem("gemini_session_key", cleanKey);
      } else {
        sessionStorage.removeItem("gemini_session_key");
      }
      toast.success("Đã xác minh kết nối Gemini và tải danh sách model thành công.");
    } catch (e: any) {
      toast.error(e.message || "Không kết nối được đến Gemini.");
    } finally {
      setCheckingKey(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const next: File[] = [...attachedFiles];
    for (const f of Array.from(files)) {
      if (!ALLOWED_FILE.test(f.name)) {
        toast.error(`${f.name}: chỉ hỗ trợ Word (.docx), PDF, ảnh, TXT.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: dung lượng tối đa 10 MB.`);
        continue;
      }
      if (next.length >= 6) {
        toast.error("Tối đa 6 tệp đính kèm.");
        break;
      }
      next.push(f);
    }
    setAttachedFiles(next);
  };

  // Full AI Generation
  const generateFullSKKN = async () => {
    const missing = fields.find((f) => f.required && !profile[f.key].trim());
    if (missing) {
      toast.error(`Vui lòng nhập thông tin: ${missing.label}.`);
      document.getElementById(`field-${missing.key}`)?.focus();
      return;
    }

    if (!apiKey.trim()) {
      setSettingsOpen(true);
      return toast.info("Vui lòng kết nối Gemini API Key để khởi tạo nội dung bằng AI.");
    }

    setBusy(true);
    setStage("loading");
    setProgress(15);
    const progressInterval = setInterval(() => {
      setProgress((v) => (v < 90 ? v + 5 : v));
    }, 1200);

    try {
      const fd = new FormData();
      fd.set("key", apiKey.trim());
      fd.set("model", model);
      fd.set("action", "full");
      Object.entries(profile).forEach(([k, v]) => fd.set(k, v));
      Object.entries(requirements).forEach(([k, v]) => fd.set(k, String(v)));
      attachedFiles.forEach((file) => fd.append("files", file));

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi khi tạo sáng kiến.");

      clearInterval(progressInterval);
      setProgress(100);

      if (Array.isArray(data.sections) && data.sections.length === 6) {
        setDrafts(data.sections);
        setStage("complete");
        toast.success(`Đã khởi tạo thành công 6 phần sáng kiến qua ${data.usedModel || model}!`);
        setTimeout(() => workRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        throw new Error("Dữ liệu phản hồi chưa đủ 6 phần. Vui lòng thử lại.");
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setStage("form");
      toast.error(e.message || "Không thể tạo sáng kiến.");
    } finally {
      setBusy(false);
    }
  };

  // Section by section generation
  const generateSingleSection = async (index: number) => {
    if (!apiKey.trim()) {
      setSettingsOpen(true);
      return toast.info("Vui lòng kết nối Gemini API Key.");
    }
    setBusy(true);
    setPhase(index);
    setStage("loading");
    setProgress(20);

    try {
      const fd = new FormData();
      fd.set("key", apiKey.trim());
      fd.set("model", model);
      fd.set("action", "section");
      fd.set("sectionIndex", String(index));
      Object.entries(profile).forEach(([k, v]) => fd.set(k, v));
      Object.entries(requirements).forEach(([k, v]) => fd.set(k, String(v)));
      attachedFiles.forEach((file) => fd.append("files", file));

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo mục này.");

      const nextDrafts = [...drafts];
      while (nextDrafts.length < 6) nextDrafts.push("");
      nextDrafts[index] = data.content;
      setDrafts(nextDrafts);
      setStage(nextDrafts.every(Boolean) ? "complete" : "review");
      toast.success(`Đã hoàn thiện ${phaseMeta[index].label}.`);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo mục.");
      setStage("form");
    } finally {
      setBusy(false);
    }
  };

  // Rewrite section
  const handleRewrite = async () => {
    if (!apiKey.trim()) return toast.info("Vui lòng kết nối Gemini API Key.");
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: apiKey.trim(),
          model,
          action: "rewrite",
          sectionIndex: phase,
          revision: revisionPrompt,
          existingContent: drafts[phase] || "",
          title: profile.title,
          subject: profile.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể diễn đạt lại.");

      const next = [...drafts];
      next[phase] = data.content;
      setDrafts(next);
      setRewriteOpen(false);
      setRevisionPrompt("");
      toast.success("Đã diễn đạt lại mục thành công.");
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi chỉnh sửa.");
    } finally {
      setBusy(false);
    }
  };

  // Evaluation trigger
  const runEvaluation = async () => {
    if (!evalDocText.trim() || evalDocText.trim().length < 50) {
      return toast.error("Vui lòng dán hoặc tải tài liệu đề tài SKKN cần thẩm định (tối thiểu 50 ký tự).");
    }
    if (!apiKey.trim()) {
      setSettingsOpen(true);
      return toast.info("Vui lòng kết nối Gemini API Key để tiến hành thẩm định.");
    }
    setEvalBusy(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: apiKey.trim(),
          model,
          documentText: evalDocText,
          title: evalTitle || profile.title,
          subject: evalSubject || profile.subject,
          grade: profile.grade,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi trong quá trình thẩm định.");
      setEvalResult(data);
      toast.success(`Đã thẩm định xong đề tài! Điểm đạt: ${data.totalScore}/100 (${data.ranking}).`);
    } catch (e: any) {
      toast.error(e.message || "Không thể thẩm định đề tài.");
    } finally {
      setEvalBusy(false);
    }
  };

  const exportRealDocx = async () => {
    if (!drafts.length) return toast.error("Chưa có nội dung để xuất tệp Word.");
    try {
      toast.info("Đang tạo tệp Word (.docx) chuẩn A4 theo Nghị định 30...");
      const blob = await generateDocxBlob({
        title: profile.title || "Sáng Kiến Kinh Nghiệm",
        author: profile.author,
        school: profile.school,
        year: profile.year,
        subject: profile.subject,
        sections: drafts,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SKKN_${(profile.author || "GiaoVien").replace(/\s+/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất tệp Word (.docx) chuẩn OpenXML thành công!");
    } catch (e: any) {
      toast.error("Lỗi tạo tệp Word: " + e.message);
    }
  };

  return (
    <div className="site-shell min-h-screen">
      <Toaster richColors position="top-center" />

      {/* TOPBAR */}
      <header className="topbar sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-7xl mx-auto w-full">
          <div className="brand-lockup flex items-center gap-2 cursor-pointer" onClick={() => { setStage("form"); setAppTab("write"); }}>
            <span className="p-2 rounded-xl bg-primary/10 text-primary"><Sparkles size={22} /></span>
            <div>
              <b className="text-base font-bold tracking-tight block">TRỢ LÝ SÁNG KIẾN VIP</b>
              <small className="text-xs text-primary font-medium block">CHƯƠNG TRÌNH GDPT 2018 · BAREM 100 ĐIỂM</small>
            </div>
          </div>

          {/* MAIN TABS SWITCHER */}
          <div className="main-nav-tabs hidden sm:flex">
            <button
              type="button"
              className={`main-nav-tab ${appTab === "write" ? "active" : ""}`}
              onClick={() => setAppTab("write")}
            >
              <FileSignature size={17} /> Soạn Thảo Sáng Kiến
            </button>
            <button
              type="button"
              className={`main-nav-tab ${appTab === "evaluate" ? "active" : ""}`}
              onClick={() => setAppTab("evaluate")}
            >
              <Award size={17} /> Thẩm Định & Chấm Điểm 100Đ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Hướng dẫn sử dụng"
              className="guide-button hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle size={16} /> Hướng dẫn
            </button>
            <ThemeToggle />
            <button
              type="button"
              aria-label="Cấu hình AI"
              title="Cấu hình Gemini API Key"
              className="icon-button"
              style={{ width: "38px", height: "38px" }}
              onClick={() => setSettingsOpen(true)}
            >
              <KeyRound size={18} />
            </button>
            <span className="w-9 h-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shadow-xs">
              GV
            </span>
          </div>
        </div>
      </header>

      {/* MOBILE NAV TABS */}
      <div className="sm:hidden flex p-2 border-b bg-card justify-center">
        <div className="main-nav-tabs w-full justify-center">
          <button
            type="button"
            className={`main-nav-tab flex-1 justify-center ${appTab === "write" ? "active" : ""}`}
            onClick={() => setAppTab("write")}
          >
            <FileSignature size={16} /> Soạn Thảo
          </button>
          <button
            type="button"
            className={`main-nav-tab flex-1 justify-center ${appTab === "evaluate" ? "active" : ""}`}
            onClick={() => setAppTab("evaluate")}
          >
            <Award size={16} /> Thẩm Định 100Đ
          </button>
        </div>
      </div>

      <main className="page-content mx-auto pb-20">
        {/* TAB 1: SOẠN THẢO SÁNG KIẾN */}
        {appTab === "write" && (
          <div>
            {/* HERO */}
            <div className="sunrise-hero">
              <div>
                <span className="eyebrow font-bold text-xs uppercase tracking-wider block">
                  GIẢI PHÁP SƯ PHẠM ĐỘT PHÁ · CHUẨN MỰC NGHỊ ĐỊNH 13/2012/NĐ-CP
                </span>
                <h1>Xây dựng sáng kiến<span>nâng tầm chất lượng dạy học.</span></h1>
                <p className="hero-lead">
                  Hệ thống hỗ trợ giáo viên cấu trúc hồ sơ, chuẩn hóa 4 thành tố cốt lõi và phát triển 6 phần nội dung hoàn chỉnh với công nghệ AI hàng đầu.
                </p>
                <div className="hero-actions">
                  <button type="button" onClick={generateFullSKKN} disabled={busy}>
                    {busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
                    Tạo Toàn Bộ 6 Phần (AI Siêu Tốc)
                  </button>
                  <button type="button" onClick={() => { setStage("review"); generateSingleSection(0); }} disabled={busy}>
                    <ListChecks size={18} /> Soạn Thảo Từng Bước (Guided)
                  </button>
                </div>
                <div className="trust-row">
                  <span><ShieldCheck size={16} /> Bảo vệ bởi Gemini Resilience Gateway</span>
                  <span><Check size={16} /> Xuất Word (.docx) chuẩn Nghị định 30</span>
                </div>
              </div>
              <div className="welcome-note">
                <h2>“Sáng kiến xuất phát từ trăn trở trong lớp học.”</h2>
                <p>— GS. Viện Khoa học Giáo dục</p>
                <span>Hệ thống tự động phát hiện số liệu đối chứng và cấu trúc quy trình các bước mạch lạc.</span>
              </div>
            </div>

            {/* 1-CLICK SAMPLE FIXTURES */}
            <div className="sample-bar">
              <span>⚡ THỬ NGAY VỚI ĐỀ TÀI MẪU:</span>
              {SAMPLE_SKKN_FIXTURES.map((fix) => (
                <button
                  key={fix.id}
                  type="button"
                  className="sample-chip"
                  onClick={() => loadSample(fix)}
                >
                  <Sparkles size={14} /> {fix.name} ({fix.badge})
                </button>
              ))}
            </div>

            {/* PROGRESS STEPPER */}
            <nav className="setup-progress grid gap-2 mb-6" aria-label="Tiến độ soạn thảo">
              {["1. Thông tin", "2. Điểm mới", "3. Tài liệu", "4. Xuất bản", "5. Xem trước", "6. Hoàn tất"].map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  className={stage === "complete" || (stage === "review" && idx <= phase) ? "done" : ""}
                  onClick={() => {
                    if (stage === "complete" || stage === "review") {
                      setPhase(Math.min(idx, 5));
                    }
                  }}
                >
                  <b>{label}</b>
                </button>
              ))}
            </nav>

            {/* MAIN INPUT WORKSPACE */}
            {stage === "form" && (
              <div className="grid gap-8">
                {/* THÔNG TIN TÁC GIẢ & ĐỀ TÀI */}
                <section className="setup-card panel p-6 border rounded-2xl bg-card">
                  <div className="section-heading flex items-center gap-3 mb-6">
                    <span className="p-2.5 rounded-xl text-white"><UserRound size={20} /></span>
                    <div>
                      <h2 className="text-xl font-bold">I. Hồ Sơ Tác Giả & Định Hướng Đề Tài</h2>
                      <p className="text-sm text-muted-foreground">Điền các thông số cơ bản hoặc nhấn nạp Mẫu đề tài ở trên để trải nghiệm nhanh.</p>
                    </div>
                  </div>

                  <div className="profile-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fields.map((f) => (
                      <div key={f.key} className={`field-card p-4 rounded-xl border relative ${f.multiline ? "md:col-span-2" : ""}`}>
                        <label htmlFor={`field-${f.key}`} className="text-xs font-bold uppercase tracking-wider block mb-1 text-muted-foreground">
                          {f.label} {f.required && <span className="text-destructive">*</span>}
                        </label>
                        {f.multiline ? (
                          <textarea
                            id={`field-${f.key}`}
                            rows={2}
                            className="w-full p-2 rounded-lg border text-sm outline-none"
                            placeholder={f.placeholder}
                            value={profile[f.key]}
                            onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                          />
                        ) : (
                          <input
                            id={`field-${f.key}`}
                            type="text"
                            className="w-full p-2 rounded-lg border text-sm outline-none"
                            placeholder={f.placeholder}
                            value={profile[f.key]}
                            onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* YÊU CẦU ĐẦU RA & TÀI LIỆU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TIÊU CHÍ ĐẦU RA */}
                  <section className="setup-card panel p-6 border rounded-2xl bg-card">
                    <div className="section-heading flex items-center gap-3 mb-4">
                      <span className="p-2.5 rounded-xl text-white"><SlidersHorizontal size={20} /></span>
                      <div>
                        <h3 className="text-lg font-bold">II. Yêu Cầu Đầu Ra Sáng Kiến</h3>
                        <p className="text-xs text-muted-foreground">Tùy biến độ sâu và số lượng giải pháp</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase block mb-1">Số lượng biện pháp trọng tâm: {requirements.solutionCount}</label>
                        <input
                          type="range"
                          min={1}
                          max={6}
                          value={requirements.solutionCount}
                          onChange={(e) => setRequirements({ ...requirements, solutionCount: Number(e.target.value) })}
                          className="w-full cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1 biện pháp</span>
                          <span>3 biện pháp (chuẩn)</span>
                          <span>6 biện pháp</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={requirements.realExamples}
                            onCheckedChange={(v) => setRequirements({ ...requirements, realExamples: !!v })}
                          />
                          <span>Bắt buộc có ví dụ bài học cụ thể (hoạt động/giáo án minh họa)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={requirements.statistics}
                            onCheckedChange={(v) => setRequirements({ ...requirements, statistics: !!v })}
                          />
                          <span>Yêu cầu bảng số liệu khảo nghiệm đối chứng trước & sau thực nghiệm</span>
                        </label>
                      </div>
                    </div>
                  </section>

                  {/* TÀI LIỆU ĐÍNH KÈM */}
                  <section className="setup-card panel p-6 border rounded-2xl bg-card">
                    <div className="section-heading flex items-center gap-3 mb-4">
                      <span className="p-2.5 rounded-xl text-white"><Upload size={20} /></span>
                      <div>
                        <h3 className="text-lg font-bold">III. Đính Kèm Tài Liệu & Giáo Án</h3>
                        <p className="text-xs text-muted-foreground">Bóc tách trực tiếp nội dung Word (.docx), PDF, ảnh minh chứng</p>
                      </div>
                    </div>

                    <div
                      className="upload-drop p-6 border-2 border-dashed rounded-xl text-center cursor-pointer hover:bg-muted/20 transition"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={32} className="mx-auto mb-2 text-primary" />
                      <p className="text-sm font-semibold">Kéo thả hoặc nhấn để chọn tệp</p>
                      <span className="text-xs text-muted-foreground block">Hỗ trợ .docx, .doc, .pdf, .txt, hình ảnh (tối đa 10 MB)</span>
                      <input
                        hidden
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".docx,.doc,.pdf,.txt,.png,.jpg,.jpeg,.webp"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </div>

                    {attachedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachedFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={16} />
                              <span className="font-medium truncate">{file.name}</span>
                              <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <button
                              type="button"
                              className="text-destructive hover:underline"
                              onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {/* LOADING STATE */}
            {stage === "loading" && (
              <div className="panel p-12 text-center border rounded-2xl bg-card my-12 space-y-6 max-w-2xl mx-auto shadow-lg">
                <LoaderCircle size={48} className="spin mx-auto text-primary" />
                <h3 className="text-2xl font-bold">{phaseMeta[phase]?.label}</h3>
                <p className="text-muted-foreground text-sm">{phaseMeta[phase]?.loading}</p>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground block">Đang điều phối bởi Gemini Resilience Gateway · Tự động chống nghẽn</span>
              </div>
            )}

            {/* COMPLETE & REVIEW VIEWER */}
            {(stage === "complete" || stage === "review") && (
              <div ref={workRef} className="final-preview border rounded-2xl bg-card p-6 shadow-md my-8 space-y-6">
                {/* TOOLBAR */}
                <div className="final-toolbar flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <b className="text-sm font-bold uppercase">Nội dung sáng kiến hoàn chỉnh</b>
                    <span className="text-xs text-muted-foreground">({drafts.filter(Boolean).length}/6 phần)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background text-sm font-semibold"
                      onClick={() => {
                        navigator.clipboard.writeText(drafts.join("\n\n"));
                        toast.success("Đã sao chép toàn văn sáng kiến vào bộ nhớ tạm.");
                      }}
                    >
                      <Clipboard size={16} /> Sao chép toàn văn
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-xs"
                      onClick={exportRealDocx}
                    >
                      <Download size={16} /> Xuất Word (.docx A4)
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background text-sm font-semibold"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} /> In / Lưu PDF
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background text-sm font-semibold"
                      onClick={() => setStage("form")}
                    >
                      <RotateCcw size={16} /> Chỉnh sửa hồ sơ
                    </button>
                  </div>
                </div>

                {/* SECTION TABS FOR STEPPED REVIEW */}
                <div className="flex flex-wrap gap-1 border-b pb-2">
                  {phaseMeta.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                        phase === idx ? "bg-primary text-white" : "bg-muted/50 hover:bg-muted text-muted-foreground"
                      }`}
                      onClick={() => setPhase(idx)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* CURRENT SECTION CONTENT */}
                <div className="final-document p-8 rounded-xl border bg-card space-y-4 leading-relaxed text-justify">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-lg font-bold text-primary">{phaseMeta[phase]?.label}</h2>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border text-primary hover:bg-primary/5 font-semibold"
                      onClick={() => setRewriteOpen(true)}
                    >
                      <PencilLine size={14} /> AI Viết Lại Mục Này
                    </button>
                  </div>

                  <div className="whitespace-pre-wrap font-serif text-[15px] space-y-3">
                    {drafts[phase] || (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Mục này chưa có nội dung.</p>
                        <button
                          type="button"
                          className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                          onClick={() => generateSingleSection(phase)}
                        >
                          Tạo mục này bằng AI
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM SUMMARY & COMPLETE STAMP */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                  <span>Định dạng chuẩn: Times New Roman 14pt, giãn dòng 1.5, căn lề Nghị định 30</span>
                  <button
                    type="button"
                    className="text-primary hover:underline font-bold flex items-center gap-1"
                    onClick={() => {
                      setEvalDocText(drafts.join("\n\n"));
                      setEvalTitle(profile.title);
                      setEvalSubject(profile.subject);
                      setAppTab("evaluate");
                      toast.success("Đã nạp toàn văn sáng kiến sang Phân hệ Thẩm định 100 điểm!");
                    }}
                  >
                    <Award size={14} /> Chuyển sang Thẩm định & Chấm điểm 100Đ <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: THẨM ĐỊNH & CHẤM ĐIỂM (EVALUATION STUDIO) */}
        {appTab === "evaluate" && (
          <div className="space-y-8">
            <div className="sunrise-hero">
              <div>
                <span className="eyebrow font-bold text-xs uppercase tracking-wider block">
                  HỘI ĐỒNG KHOA HỌC SỐ · BAREM 100 ĐIỂM BỘ GD&ĐT
                </span>
                <h1>Thẩm định & Chấm điểm<span>sáng kiến kinh nghiệm sư phạm.</span></h1>
                <p className="hero-lead">
                  Đánh giá toàn diện 4 tiêu chuẩn: Tính mới (30đ), Tính khoa học sư phạm (30đ), Hiệu quả thực nghiệm (25đ) và Khả năng nhân rộng (15đ) theo phương pháp phản hồi Bánh kẹp (Sandwich Feedback).
                </p>
                <div className="trust-row">
                  <span><CheckCircle2 size={16} /> Chấm điểm khách quan</span>
                  <span><Sparkles size={16} /> Kèm đoạn văn mẫu viết lại chuyên sâu</span>
                  <span><Printer size={16} /> Xuất biên bản chấm điểm</span>
                </div>
              </div>
              <div className="welcome-note">
                <h2>“Phản biện chân thành, nâng tầm sáng kiến.”</h2>
                <p>— Quy chuẩn Sandwich Feedback</p>
                <span>Chỉ ra điểm thiếu sót và lập tức cung cấp phương án viết lại mẫu để giáo viên áp dụng ngay.</span>
              </div>
            </div>

            {/* 1-CLICK EVALUATION SAMPLE FIXTURES */}
            <div className="sample-bar">
              <span>⚡ THỬ THẨM ĐỊNH VỚI ĐỀ TÀI MẪU:</span>
              {SAMPLE_SKKN_FIXTURES.map((fix) => (
                <button
                  key={fix.id}
                  type="button"
                  className="sample-chip"
                  onClick={() => loadEvalSample(fix)}
                >
                  <Award size={14} /> {fix.name} ({fix.badge})
                </button>
              ))}
            </div>

            {/* EVALUATION INPUT CARD */}
            <div className="panel p-6 border rounded-2xl bg-card space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase block mb-1 text-muted-foreground">Tên đề tài</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border text-sm outline-none"
                    placeholder="VD: Ứng dụng lớp học đảo ngược..."
                    value={evalTitle}
                    onChange={(e) => setEvalTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1 text-muted-foreground">Môn học / Lĩnh vực</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border text-sm outline-none"
                    placeholder="VD: Tin học, Toán học, Vật lý..."
                    value={evalSubject}
                    onChange={(e) => setEvalSubject(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nội dung toàn văn đề tài cần thẩm định *</label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                    onClick={() => evalFileRef.current?.click()}
                  >
                    <Upload size={13} /> Tải file Word/TXT lên
                  </button>
                  <input
                    hidden
                    ref={evalFileRef}
                    type="file"
                    accept=".docx,.doc,.txt"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.name.endsWith(".txt")) {
                        setEvalDocText(await f.text());
                      } else {
                        toast.info("Đang đọc nội dung tệp Word...");
                        try {
                          const mammothMod = await import("mammoth");
                          const buf = await f.arrayBuffer();
                          const res = await mammothMod.extractRawText({ arrayBuffer: buf });
                          setEvalDocText(res.value || "");
                          toast.success(`Đã trích xuất ${res.value.length} ký tự từ file Word!`);
                        } catch {
                          toast.error("Không thể đọc file Word trực tiếp trên trình duyệt. Vui lòng copy nội dung dán vào ô dưới.");
                        }
                      }
                    }}
                  />
                </div>
                <textarea
                  rows={8}
                  className="w-full p-3.5 rounded-xl border text-sm font-serif leading-relaxed outline-none"
                  placeholder="Dán nội dung toàn văn hoặc các phần chính của sáng kiến kinh nghiệm vào đây để Hội đồng AI chấm điểm..."
                  value={evalDocText}
                  onChange={(e) => setEvalDocText(e.target.value)}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  <span>Độ dài: {evalDocText.length.toLocaleString('vi-VN')} ký tự</span>
                  {drafts.length === 6 && (
                    <button
                      type="button"
                      className="text-primary hover:underline font-semibold"
                      onClick={() => setEvalDocText(drafts.join("\n\n"))}
                    >
                      Dùng nội dung từ tab Soạn Thảo (6 phần)
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-base shadow-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
                onClick={runEvaluation}
                disabled={evalBusy}
              >
                {evalBusy ? <LoaderCircle className="spin" size={20} /> : <Award size={20} />}
                {evalBusy ? "Hội Đồng AI Đang Thẩm Định & Chấm Điểm..." : "Tiến Hành Thẩm Định & Chấm Điểm Barem 100Đ"}
              </button>
            </div>

            {/* EVALUATION RESULT REPORT */}
            {evalResult && (
              <div className="panel p-8 border rounded-2xl bg-card space-y-8 shadow-md">
                {/* HEADER & SCORE CIRCLE */}
                <div className="eval-dashboard">
                  <div className="eval-score-card">
                    <div
                      className="score-circle"
                      style={{ borderColor: evalResult.tierColor || "#16a34a" }}
                    >
                      <span className="score-number" style={{ color: evalResult.tierColor || "#16a34a" }}>
                        {evalResult.totalScore}
                      </span>
                      <span className="score-max">/ 100 ĐIỂM</span>
                    </div>
                    <span
                      className="eval-rank-badge"
                      style={{ background: evalResult.tierColor || "#16a34a" }}
                    >
                      XẾP LOẠI: {evalResult.ranking?.toUpperCase()}
                    </span>
                    <small className="text-xs text-muted-foreground mt-2">
                      Mô hình thẩm định: {evalResult.usedModel}
                    </small>
                    <button
                      type="button"
                      className="mt-4 text-xs font-semibold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5"
                      onClick={() => window.print()}
                    >
                      <Printer size={14} /> In phiếu kết quả
                    </button>
                  </div>

                  {/* 4 BAREM CRITERIA */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
                      <ListChecks size={20} /> Điểm Số Chi Tiết Theo 4 Tiêu Chí Barem
                    </h3>
                    <div className="criteria-grid">
                      {evalResult.criteria?.map((c: any) => (
                        <div key={c.id} className="criterion-card p-4 rounded-xl border bg-muted/20">
                          <div className="criterion-header flex justify-between items-center mb-1">
                            <span className="text-sm font-bold">Tiêu chí {c.id}: {c.name}</span>
                            <b className="text-primary text-base font-extrabold">{c.score} / {c.maxScore}đ</b>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mb-2">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${(c.score / c.maxScore) * 100}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                            <div className="text-emerald-700 dark:text-emerald-400">
                              <b>✓ Điểm mạnh:</b> {c.strengths}
                            </div>
                            <div className="text-amber-700 dark:text-amber-400">
                              <b>⚠ Điểm cần lưu ý:</b> {c.weaknesses}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SANDWICH FEEDBACK */}
                {evalResult.sandwichFeedback && (
                  <div className="sandwich-card rounded-2xl border overflow-hidden">
                    <div className="p-4 bg-muted/40 font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b">
                      <Award size={18} className="text-primary" /> Phản hồi sư phạm chuẩn mực (Sandwich Feedback)
                    </div>

                    {/* LAYER 1: PRAISE */}
                    <div className="sandwich-layer praise p-5">
                      <b className="text-sm font-bold block mb-1">🌟 LỚP 1: GHI NHẬN TÂM HUYẾT & ĐIỂM SÁNG</b>
                      <p className="text-sm leading-relaxed">{evalResult.sandwichFeedback.praise}</p>
                    </div>

                    {/* LAYER 2: CRITIQUE & REWRITTEN SAMPLE */}
                    <div className="sandwich-layer critique p-5">
                      <b className="text-sm font-bold block mb-1">🔍 LỚP 2: CÁC ĐIỂM CẦN HOÀN THIỆN ĐỂ NÂNG HẠNG GIẢI</b>
                      <p className="text-sm leading-relaxed">{evalResult.sandwichFeedback.critique}</p>

                      {evalResult.sandwichFeedback.rewrittenSample && (
                        <div className="rewritten-sample-box mt-3">
                          <b className="text-xs font-bold block mb-1 text-amber-800 dark:text-amber-300">
                            ĐOẠN VĂN GỢI Ý VIẾT LẠI MẪU (THẦY/CÔ CÓ THỂ SAO CHÉP ĐƯA VÀO BÀI):
                          </b>
                          <p className="italic text-xs font-serif leading-relaxed text-foreground">
                            {evalResult.sandwichFeedback.rewrittenSample}
                          </p>
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-background border shadow-2xs"
                            onClick={() => {
                              navigator.clipboard.writeText(evalResult.sandwichFeedback.rewrittenSample);
                              toast.success("Đã sao chép đoạn văn mẫu vào bộ nhớ tạm!");
                            }}
                          >
                            <Clipboard size={12} /> Sao chép đoạn mẫu
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LAYER 3: ENCOURAGEMENT */}
                    <div className="sandwich-layer encouragement p-5">
                      <b className="text-sm font-bold block mb-1">🚀 LỚP 3: KHÍCH LỆ & TRIỂN VỌNG ĐẠT GIẢI</b>
                      <p className="text-sm leading-relaxed">{evalResult.sandwichFeedback.encouragement}</p>
                    </div>
                  </div>
                )}

                {/* RECOMMENDATIONS */}
                {evalResult.actionableRecommendations?.length > 0 && (
                  <div className="recommendations-box p-5 rounded-xl border">
                    <b className="text-sm font-bold block mb-2">📌 Khuyến nghị hành động tiếp theo:</b>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground">
                      {evalResult.actionableRecommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI SETTINGS DIALOG */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="text-primary" /> Cấu hình Gemini AI & API Key
            </DialogTitle>
            <DialogDescription>
              Kết nối trực tiếp tài khoản Google AI của Thầy/Cô để khởi tạo và thẩm định không giới hạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200 flex items-start gap-2">
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <span>
                Bảo vệ bởi <b>Gemini Resilience Gateway</b>: Tự động chuyển tầng dự phòng khi mạng quá tải hoặc nghẽn trễ giờ cao điểm.
              </span>
            </div>

            <div>
              <label htmlFor="api-key-input" className="text-xs font-bold uppercase block mb-1 text-muted-foreground">
                GEMINI API KEY <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="api-key-input"
                  type={showKey ? "text" : "password"}
                  className="w-full p-2.5 pr-10 rounded-lg border text-sm outline-none"
                  placeholder="Nhập API Key (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rememberSession}
                  onCheckedChange={(v) => {
                    const c = !!v;
                    setRememberSession(c);
                    if (c && apiKey.trim()) sessionStorage.setItem("gemini_session_key", apiKey.trim());
                    else sessionStorage.removeItem("gemini_session_key");
                  }}
                />
                <span>Ghi nhớ trong phiên (sessionStorage)</span>
              </label>
              {apiKey && (
                <button
                  type="button"
                  className="text-destructive hover:underline"
                  onClick={() => {
                    setApiKey("");
                    sessionStorage.removeItem("gemini_session_key");
                  }}
                >
                  Xóa khóa
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Khóa chỉ lưu trong bộ nhớ phiên, không ghi vĩnh viễn trên máy chủ.{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
                Lấy API Key miễn phí ↗
              </a>
            </p>

            <button
              type="button"
              className="w-full py-2.5 rounded-lg border bg-muted/40 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted transition"
              onClick={checkAiConnection}
              disabled={checkingKey}
            >
              {checkingKey ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}
              Kiểm tra kết nối & tải danh sách model
            </button>

            {models.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase block mb-1 text-muted-foreground">Mô hình ưu tiên</label>
                <select
                  className="w-full p-2.5 rounded-lg border text-sm outline-none bg-card"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-xs"
              onClick={() => {
                if (rememberSession && apiKey.trim()) {
                  sessionStorage.setItem("gemini_session_key", apiKey.trim());
                }
                setSettingsOpen(false);
                toast.success("Đã lưu cấu hình AI thành công.");
              }}
            >
              Áp dụng cấu hình
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* REWRITE SECTION DIALOG */}
      <Dialog open={rewriteOpen} onOpenChange={setRewriteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="text-primary" /> Diễn đạt lại {phaseMeta[phase]?.label}
            </DialogTitle>
            <DialogDescription>
              Nhập các chỉ dẫn cần thêm, bớt hoặc điều chỉnh (ví dụ: bổ sung số liệu đối chứng, viết sâu sắc hơn, lược bỏ bớt phần lý thuyết...).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <textarea
              rows={4}
              className="w-full p-3 rounded-lg border text-sm outline-none font-serif"
              placeholder="VD: Bổ sung thêm bảng khảo nghiệm định lượng có lớp thực nghiệm và lớp đối chứng, so sánh tỉ lệ %..."
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
            />

            <button
              type="button"
              className="w-full py-3 rounded-lg bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
              onClick={handleRewrite}
              disabled={busy}
            >
              {busy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
              {busy ? "AI Đang Viết Lại..." : "Tiến Hành Viết Lại Bằng AI"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* HELP DIALOG */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Hướng Dẫn Sử Dụng Trợ Lý Sáng Kiến VIP</DialogTitle>
            <DialogDescription>
              Ba bước để xây dựng và thẩm định sáng kiến kinh nghiệm đạt điểm cao.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm leading-relaxed py-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
              <div>
                <b>Nhập thông tin hoặc nạp Mẫu đề tài</b>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Điền các trường hồ sơ hoặc bấm thử ngay 1 trong 3 mẫu đề tài thực tế (Xuất sắc, Khá, Chưa đạt). Đính kèm giáo án hoặc tài liệu Word (.docx) nếu có.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
              <div>
                <b>Tạo 6 phần hoàn chỉnh & Tinh chỉnh từng mục</b>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chọn tạo nhanh toàn bộ 6 phần hoặc duyệt từng mục. Giáo viên có thể dùng nút 'AI Viết lại' để chỉ dẫn điều chỉnh câu từ hoặc số liệu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border">
              <span className="w-7 h-7 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
              <div>
                <b>Thẩm định Barem 100Đ & Xuất tệp Word (.docx)</b>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chuyển nội dung sang tab Thẩm định để xem Barem chấm điểm và nhận xét Sandwich Feedback (kèm đoạn mẫu viết lại). Sau đó xuất tệp Word A4 chuẩn Nghị định 30.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
