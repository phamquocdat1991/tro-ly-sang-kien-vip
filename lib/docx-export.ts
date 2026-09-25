import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LineRuleType,
} from "docx";

export interface DocxExportInput {
  title: string;
  author: string;
  school: string;
  year: string;
  subject: string;
  sections: string[];
}

export async function generateDocxBlob(input: DocxExportInput): Promise<Blob> {
  const children: Paragraph[] = [];

  // Trang bìa / Tiêu đề đầu trang
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: (input.school || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase(),
          font: "Times New Roman",
          bold: true,
          size: 24, // 12pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: "HỘI ĐỒNG THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM",
          font: "Times New Roman",
          bold: true,
          size: 26, // 13pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 300 },
      children: [
        new TextRun({
          text: "BÁO CÁO KẾT QUẢ NGHIÊN CỨU",
          font: "Times New Roman",
          bold: true,
          size: 28, // 14pt
          color: "1e3a8a",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: (input.title || "SÁNG KIẾN KINH NGHIỆM").toUpperCase(),
          font: "Times New Roman",
          bold: true,
          size: 32, // 16pt
          color: "b91c1c",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "• Tác giả: ",
          font: "Times New Roman",
          bold: true,
          size: 28,
        }),
        new TextRun({
          text: input.author || "Giáo viên",
          font: "Times New Roman",
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "• Đơn vị công tác: ",
          font: "Times New Roman",
          bold: true,
          size: 28,
        }),
        new TextRun({
          text: input.school || "Trường học",
          font: "Times New Roman",
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "• Môn học / Lĩnh vực: ",
          font: "Times New Roman",
          bold: true,
          size: 28,
        }),
        new TextRun({
          text: input.subject || "Giáo dục",
          font: "Times New Roman",
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: "• Năm học: ",
          font: "Times New Roman",
          bold: true,
          size: 28,
        }),
        new TextRun({
          text: input.year || "2026 - 2027",
          font: "Times New Roman",
          size: 28,
        }),
      ],
    })
  );

  // Phân tích từng phần nội dung Markdown sang Paragraphs Word
  for (const rawSection of input.sections) {
    const lines = rawSection.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        children.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      if (line.startsWith("# ")) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 },
            children: [
              new TextRun({
                text: line.slice(2).toUpperCase(),
                font: "Times New Roman",
                bold: true,
                size: 30, // 15pt
                color: "1e3a8a",
              }),
            ],
          })
        );
      } else if (line.startsWith("## ")) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: line.slice(3),
                font: "Times New Roman",
                bold: true,
                size: 28, // 14pt
              }),
            ],
          })
        );
      } else if (line.startsWith("### ")) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 180, after: 100 },
            children: [
              new TextRun({
                text: line.slice(4),
                font: "Times New Roman",
                bold: true,
                italics: true,
                size: 28,
              }),
            ],
          })
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80, line: 360, lineRule: LineRuleType.AUTO },
            children: [
              new TextRun({
                text: line.slice(2),
                font: "Times New Roman",
                size: 28,
              }),
            ],
          })
        );
      } else {
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 360, lineRule: LineRuleType.AUTO }, // 1.5 lines
            indent: { firstLine: 720 }, // Thụt đầu dòng 1.27 cm
            children: [
              new TextRun({
                text: line,
                font: "Times New Roman",
                size: 28, // 14pt
              }),
            ],
          })
        );
      }
    }
  }

  // Chữ ký tác giả
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400, after: 100 },
      children: [
        new TextRun({
          text: `..., ngày ... tháng ... năm ...`,
          font: "Times New Roman",
          italics: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: "TÁC GIẢ SÁNG KIẾN\n(Ký và ghi rõ họ tên)\n\n\n\n",
          font: "Times New Roman",
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: input.author || "Giáo viên",
          font: "Times New Roman",
          bold: true,
          size: 28,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm
              bottom: 1134, // 2cm
              left: 1701, // 3cm
              right: 1134, // 2cm
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
