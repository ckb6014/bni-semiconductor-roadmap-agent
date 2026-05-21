const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const model = process.env.OPENAI_MODEL || "gpt-5";
const uploadRoot = path.join(root, "uploads");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".hwp": "application/x-hwp",
  ".hwpx": "application/haansofthwp"
};

const allowedUploadExts = new Set([".hwp", ".hwpx", ".doc", ".docx", ".pdf"]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/gpt-search") {
      await handleGptSearch(req, res);
      return;
    }

    const uploadMatch = url.pathname.match(/^\/api\/analysis-units\/([^/]+)\/uploads$/);
    if (uploadMatch) {
      if (req.method === "GET") {
        await handleListUploads(res, decodeURIComponent(uploadMatch[1]));
        return;
      }
      if (req.method === "POST") {
        await handleUpload(req, res, decodeURIComponent(uploadMatch[1]));
        return;
      }
    }

    const appendMatch = url.pathname.match(/^\/api\/analysis-units\/([^/]+)\/append$/);
    if (req.method === "POST" && appendMatch) {
      await handleAppend(req, res, decodeURIComponent(appendMatch[1]));
      return;
    }

    if (req.method !== "GET") {
      sendJson(res, 405, { error: "지원하지 않는 요청입니다." });
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
});

server.listen(port, () => {
  console.log(`Serving BNI Semiconductor Roadmap Agent at http://localhost:${port}/site/`);
});

async function handleGptSearch(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 400, {
      error: "OPENAI_API_KEY 환경변수가 없습니다. PowerShell에서 $env:OPENAI_API_KEY='키값' 설정 후 다시 실행하세요."
    });
    return;
  }

  const body = await readJson(req);
  const unit = body.unit || {};
  const references = Array.isArray(body.references) ? body.references : [];
  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  const query = String(body.query || "").trim();
  const markdown = String(body.markdown || "").slice(0, 12000);

  if (!query) {
    sendJson(res, 400, { error: "검색어가 비어 있습니다." });
    return;
  }

  const prompt = [
    "너는 중소기업 전략기술로드맵 반도체 분야 보고서를 작성하는 PM급 AI Agent다.",
    "사용자 질문에 대해 보고서에 바로 반영 가능한 한국어 Markdown으로 답하라.",
    "분석 기간은 2024-2026년이며, 국내외 정책·산업·시장·기술·지재권·중기부 지원과제 관점을 구분한다.",
    "출처 확인이 필요한 수치, 법령명, 기업 동향, 정책 변경 사항은 '검증 필요'로 표시하라.",
    "전략품목 후보군 또는 R&D Dashboard와 연결되는 시사점은 표로 정리하라.",
    "",
    `현재 분석 단위: ${unit.title || ""}`,
    `역할: ${unit.owner || ""}`,
    `분석 구분: ${unit.level || ""}`,
    `분석 범위: ${(unit.scope || []).join(", ")}`,
    "",
    "현재 Markdown:",
    markdown,
    "",
    "등록 원문 파일:",
    uploads.map((item, index) => `${index + 1}. ${item.originalName || ""} ${item.ext || ""} ${item.uploadedAt || ""}`).join("\n"),
    "",
    "등록 참고문헌:",
    references.map((item, index) => `${index + 1}. ${item.title || ""} ${item.source || ""} ${item.url || ""} ${item.memo || ""}`).join("\n"),
    "",
    "사용자 검색 요청:",
    query
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 2200
    })
  });

  const data = await response.json();
  if (!response.ok) {
    sendJson(res, response.status, { error: data.error?.message || "OpenAI API 호출에 실패했습니다." });
    return;
  }

  sendJson(res, 200, { result: extractText(data), rawId: data.id });
}

async function handleListUploads(res, unitId) {
  const unit = await findUnit(unitId);
  if (!unit) {
    sendJson(res, 404, { error: "분석 단위를 찾을 수 없습니다." });
    return;
  }

  sendJson(res, 200, { files: await listUploads(unitId) });
}

async function handleUpload(req, res, unitId) {
  const unit = await findUnit(unitId);
  if (!unit) {
    sendJson(res, 404, { error: "분석 단위를 찾을 수 없습니다." });
    return;
  }

  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    sendJson(res, 400, { error: "multipart/form-data 요청만 지원합니다." });
    return;
  }

  const body = await readBuffer(req);
  const files = parseMultipartFiles(body, boundaryMatch[1] || boundaryMatch[2]);
  if (!files.length) {
    sendJson(res, 400, { error: "업로드할 파일이 없습니다." });
    return;
  }

  const unitUploadDir = path.join(uploadRoot, unitId);
  await fs.mkdir(unitUploadDir, { recursive: true });

  for (const file of files) {
    const ext = path.extname(file.filename).toLowerCase();
    if (!allowedUploadExts.has(ext)) {
      sendJson(res, 400, { error: `${file.filename} 형식은 지원하지 않습니다. HWP, HWPX, DOC, DOCX, PDF만 업로드할 수 있습니다.` });
      return;
    }

    const safeName = safeFileName(file.filename);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.writeFile(path.join(unitUploadDir, `${stamp}-${safeName}`), file.content);
  }

  sendJson(res, 200, { files: await listUploads(unitId) });
}

async function handleAppend(req, res, unitId) {
  const unit = await findUnit(unitId);

  if (!unit) {
    sendJson(res, 404, { error: "분석 단위를 찾을 수 없습니다." });
    return;
  }

  const body = await readJson(req);
  const filePath = path.resolve(root, "content", unit.file);
  const contentDir = path.resolve(root, "content");
  if (!filePath.startsWith(contentDir)) {
    sendJson(res, 400, { error: "허용되지 않은 파일 경로입니다." });
    return;
  }

  const current = await fs.readFile(filePath, "utf8");
  const heading = String(body.heading || "반영 결과").trim();
  const markdown = String(body.markdown || "").trim();
  const stamp = new Date().toISOString().slice(0, 10);
  const appended = `${current.trim()}\n\n## ${heading} (${stamp})\n\n${markdown}\n`;

  await fs.writeFile(filePath, appended, "utf8");
  sendJson(res, 200, { markdown: appended });
}

async function serveStatic(pathname, res) {
  if (pathname === "/" || pathname === "/site") {
    res.writeHead(302, { Location: "/site/" });
    res.end();
    return;
  }

  const cleanPath = pathname;
  const filePath = path.resolve(root, `.${decodeURIComponent(cleanPath)}`);

  if (!filePath.startsWith(root)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath);
    const data = await fs.readFile(finalPath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    sendText(res, 404, "Not Found");
  }
}

async function findUnit(unitId) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "content", "manifest.json"), "utf8"));
  return manifest.analysisUnits.find((item) => item.id === unitId);
}

async function listUploads(unitId) {
  const unitUploadDir = path.join(uploadRoot, unitId);
  try {
    const names = await fs.readdir(unitUploadDir);
    const files = await Promise.all(
      names.map(async (name) => {
        const filePath = path.join(unitUploadDir, name);
        const stat = await fs.stat(filePath);
        const originalName = name.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/, "");
        return {
          name,
          originalName,
          ext: path.extname(name).toLowerCase(),
          size: stat.size,
          uploadedAt: stat.mtime.toISOString().slice(0, 19).replace("T", " "),
          url: `/uploads/${encodeURIComponent(unitId)}/${encodeURIComponent(name)}`
        };
      })
    );
    return files.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  } catch (error) {
    return [];
  }
}

async function readJson(req) {
  const buffer = await readBuffer(req);
  return JSON.parse(buffer.toString("utf8") || "{}");
}

async function readBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function parseMultipartFiles(body, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const files = [];
  let cursor = 0;

  while (cursor < body.length) {
    const start = body.indexOf(delimiter, cursor);
    if (start === -1) break;
    const next = body.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;

    const part = body.subarray(start + delimiter.length + 2, next - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headers = part.subarray(0, headerEnd).toString("utf8");
      const filename = getMultipartFileName(headers);
      if (filename) {
        files.push({
          filename,
          content: part.subarray(headerEnd + 4)
        });
      }
    }

    cursor = next;
  }

  return files;
}

function getMultipartFileName(headers) {
  const encodedMatch = headers.match(/filename\*=utf-8''([^;\r\n]+)/i);
  if (encodedMatch && encodedMatch[1]) {
    return decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, ""));
  }

  const plainMatch = headers.match(/filename="?([^";\r\n]+)"?/i);
  return plainMatch?.[1]?.trim() || "";
}

function safeFileName(fileName) {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
  return `${base || "upload"}${parsed.ext.toLowerCase()}`;
}

function extractText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim() || "응답 텍스트를 찾지 못했습니다.";
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
