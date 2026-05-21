const state = {
  units: [],
  documents: new Map(),
  references: {},
  uploads: {},
  activeFilter: "all",
  activeId: null,
  activeView: "analysis",
  query: "",
  lastGptResult: ""
};

const levelLabels = {
  environment: "환경 분석",
  dataAnalysis: "DB 교차 분석",
  strategy: "전략 도출",
  dashboard: "상용화·KPI"
};

const levelOrder = {
  environment: 1,
  dataAnalysis: 2,
  strategy: 3,
  dashboard: 4
};

const fallbackManifest = {
  project: {
    title: "중소기업 전략기술로드맵 AI Agent - 반도체 분야",
    subtitle: "분석 단위별 Markdown 기반 로드맵 작성 워크스페이스",
    version: "1.0.0",
    lastUpdated: "2026-05-20"
  },
  analysisUnits: []
};

const els = {
  unitList: document.querySelector("#unitList"),
  searchInput: document.querySelector("#searchInput"),
  tabs: document.querySelectorAll(".tab"),
  workspaceTabs: document.querySelectorAll(".workspace-tab"),
  projectTitle: document.querySelector("#projectTitle"),
  projectSubtitle: document.querySelector("#projectSubtitle"),
  version: document.querySelector("#version"),
  lastUpdated: document.querySelector("#lastUpdated"),
  totalCount: document.querySelector("#totalCount"),
  environmentCount: document.querySelector("#environmentCount"),
  strategyCount: document.querySelector("#strategyCount"),
  dashboardCount: document.querySelector("#dashboardCount"),
  selectedOwner: document.querySelector("#selectedOwner"),
  selectedTitle: document.querySelector("#selectedTitle"),
  selectedTags: document.querySelector("#selectedTags"),
  markdownBody: document.querySelector("#markdownBody"),
  uploadForm: document.querySelector("#uploadForm"),
  sourceFile: document.querySelector("#sourceFile"),
  uploadButton: document.querySelector("#uploadButton"),
  uploadStatus: document.querySelector("#uploadStatus"),
  uploadList: document.querySelector("#uploadList"),
  referenceList: document.querySelector("#referenceList"),
  referenceForm: document.querySelector("#referenceForm"),
  referenceTitle: document.querySelector("#referenceTitle"),
  referenceSource: document.querySelector("#referenceSource"),
  referenceUrl: document.querySelector("#referenceUrl"),
  referenceMemo: document.querySelector("#referenceMemo"),
  gptQuery: document.querySelector("#gptQuery"),
  gptSearchButton: document.querySelector("#gptSearchButton"),
  gptStatus: document.querySelector("#gptStatus"),
  gptResult: document.querySelector("#gptResult"),
  applyGptButton: document.querySelector("#applyGptButton"),
  exportPreview: document.querySelector("#exportPreview"),
  downloadDocButton: document.querySelector("#downloadDocButton"),
  downloadMarkdownButton: document.querySelector("#downloadMarkdownButton")
};

init();

async function init() {
  const manifest = await loadManifest();
  renderProject(manifest.project);

  state.units = manifest.analysisUnits;
  state.references = loadStoredReferences();
  await loadDocuments();

  state.activeId = state.units[0]?.id ?? null;
  bindEvents();
  render();
  renderActiveView();
  await loadUploads();
}

async function loadManifest() {
  try {
    const response = await fetch("../content/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("manifest load failed");
    return response.json();
  } catch (error) {
    els.markdownBody.innerHTML = `
      <div class="empty-state">
        <strong>Markdown 자동 로딩을 사용할 수 없습니다.</strong>
        <p>PowerShell에서 <code>.\\Start-Site.ps1</code>를 실행한 뒤 <code>http://localhost:8080/site/</code>로 접속하세요.</p>
      </div>
    `;
    return fallbackManifest;
  }
}

async function loadDocuments() {
  await Promise.all(
    state.units.map(async (unit) => {
      try {
        const response = await fetch(`../content/${unit.file}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`${unit.file} load failed`);
        const markdown = await response.text();
        state.documents.set(unit.id, markdown);
      } catch (error) {
        state.documents.set(unit.id, `# ${unit.title}\n\nMarkdown 파일을 불러오지 못했습니다.`);
      }
    })
  );
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeFilter = tab.dataset.filter;
      els.tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      render();
    });
  });

  els.workspaceTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeView = tab.dataset.view;
      renderActiveView();
    });
  });

  els.uploadForm.addEventListener("submit", uploadFiles);
  els.referenceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addReference();
  });

  els.gptSearchButton.addEventListener("click", runGptSearch);
  els.applyGptButton.addEventListener("click", applyGptResult);
  els.downloadDocButton.addEventListener("click", downloadDoc);
  els.downloadMarkdownButton.addEventListener("click", downloadMarkdown);
}

function renderProject(project) {
  els.projectTitle.textContent = project.title;
  els.projectSubtitle.textContent = project.subtitle;
  els.version.textContent = `v${project.version}`;
  els.lastUpdated.textContent = project.lastUpdated;
}

function render() {
  const filtered = getFilteredUnits();
  renderMetrics();
  renderUnitList(filtered);
}

function renderActiveView() {
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `${state.activeView}View`);
  });
  els.workspaceTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === state.activeView);
  });

  if (state.activeView === "analysis") renderDocument();
  if (state.activeView === "uploads") renderUploads();
  if (state.activeView === "references") renderReferences();
  if (state.activeView === "export") renderExportPreview();
}

function renderMetrics() {
  const counts = state.units.reduce(
    (acc, unit) => {
      acc.total += 1;
      if (unit.level === "environment") acc.environment += 1;
      if (unit.level === "dataAnalysis" || unit.level === "strategy") acc.strategy += 1;
      if (unit.level === "dashboard") acc.dashboard += 1;
      return acc;
    },
    { total: 0, environment: 0, strategy: 0, dashboard: 0 }
  );

  els.totalCount.textContent = counts.total;
  els.environmentCount.textContent = counts.environment;
  els.strategyCount.textContent = counts.strategy;
  els.dashboardCount.textContent = counts.dashboard;
}

function renderUnitList(units) {
  if (!units.length) {
    els.unitList.innerHTML = `<div class="empty-state">검색 조건에 맞는 분석 단위가 없습니다.</div>`;
    return;
  }

  els.unitList.innerHTML = units
    .map((unit) => {
      const tags = unit.tags.slice(0, 2).join(", ");
      const indent = `level-${levelOrder[unit.level] || 1}`;
      return `
        <button class="unit-button ${indent} ${unit.id === state.activeId ? "is-active" : ""}" data-id="${unit.id}" type="button">
          <span class="level-label">${levelLabels[unit.level] || unit.level}</span>
          <strong>${escapeHtml(unit.title)}</strong>
          <span class="unit-meta">
            <span class="status-pill ${unit.status}">${statusLabel(unit.status)}</span>
            <span>${escapeHtml(tags)}</span>
          </span>
        </button>
      `;
    })
    .join("");

  els.unitList.querySelectorAll(".unit-button").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeId = button.dataset.id;
      render();
      renderActiveView();
      await loadUploads();
    });
  });
}

function renderDocument() {
  const unit = getActiveUnit();
  if (!unit) return;

  els.selectedOwner.textContent = `${unit.owner} · ${levelLabels[unit.level] || unit.level} · ${statusLabel(unit.status)}`;
  els.selectedTitle.textContent = unit.title;
  els.selectedTags.innerHTML = [...unit.scope, ...unit.tags]
    .slice(0, 9)
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");
  els.markdownBody.innerHTML = markdownToHtml(withReferenceSection(unit.id, state.documents.get(unit.id) ?? ""));
}

async function loadUploads() {
  const unit = getActiveUnit();
  if (!unit) return;

  try {
    const response = await fetch(`/api/analysis-units/${encodeURIComponent(unit.id)}/uploads`, { cache: "no-store" });
    const data = await response.json();
    state.uploads[unit.id] = data.files || [];
  } catch (error) {
    state.uploads[unit.id] = [];
  }

  if (state.activeView === "uploads") renderUploads();
}

function renderUploads() {
  const unit = getActiveUnit();
  if (!unit) return;
  const files = state.uploads[unit.id] || [];

  if (!files.length) {
    els.uploadList.innerHTML = `<div class="empty-state">${escapeHtml(unit.title)}에 등록된 원문 파일이 없습니다.</div>`;
    return;
  }

  els.uploadList.innerHTML = files
    .map(
      (file) => `
        <article class="reference-item">
          <div>
            <strong>${escapeHtml(file.originalName)}</strong>
            <p>${formatBytes(file.size)} · ${escapeHtml(file.uploadedAt || "")}</p>
            <a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">파일 열기</a>
          </div>
          <span class="file-type">${escapeHtml(file.ext.replace(".", "").toUpperCase())}</span>
        </article>
      `
    )
    .join("");
}

async function uploadFiles(event) {
  event.preventDefault();
  const unit = getActiveUnit();
  const files = [...els.sourceFile.files];

  if (!unit) return;
  if (!files.length) {
    setUploadStatus("업로드할 파일을 선택하세요.", "warning");
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  setUploadStatus("파일을 업로드하고 있습니다.", "loading");
  els.uploadButton.disabled = true;

  try {
    const response = await fetch(`/api/analysis-units/${encodeURIComponent(unit.id)}/uploads`, {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "업로드에 실패했습니다.");

    state.uploads[unit.id] = data.files || [];
    els.uploadForm.reset();
    setUploadStatus("현재 분석 단위에 파일이 등록되었습니다.", "success");
    renderUploads();
  } catch (error) {
    setUploadStatus(`${error.message} 서버가 아닌 정적 서버로 실행 중이라면 .\\Start-Site.ps1로 다시 실행하세요.`, "warning");
  } finally {
    els.uploadButton.disabled = false;
  }
}

function renderReferences() {
  const unit = getActiveUnit();
  if (!unit) return;
  const references = getReferences(unit.id);

  if (!references.length) {
    els.referenceList.innerHTML = `<div class="empty-state">${escapeHtml(unit.title)}에 등록된 참고문헌이 없습니다.</div>`;
    return;
  }

  els.referenceList.innerHTML = references
    .map(
      (reference, index) => `
        <article class="reference-item">
          <div>
            <strong>${escapeHtml(reference.title)}</strong>
            <p>${escapeHtml(reference.source || "출처 미입력")}</p>
            ${reference.url ? `<a href="${escapeHtml(reference.url)}" target="_blank" rel="noreferrer">${escapeHtml(reference.url)}</a>` : ""}
            ${reference.memo ? `<p>${escapeHtml(reference.memo)}</p>` : ""}
          </div>
          <button class="icon-button" data-reference-index="${index}" type="button" aria-label="참고문헌 삭제">x</button>
        </article>
      `
    )
    .join("");

  els.referenceList.querySelectorAll("[data-reference-index]").forEach((button) => {
    button.addEventListener("click", () => {
      removeReference(unit.id, Number(button.dataset.referenceIndex));
    });
  });
}

async function runGptSearch() {
  const unit = getActiveUnit();
  const query = els.gptQuery.value.trim();
  if (!query) {
    setGptStatus("검색어를 입력하세요.", "warning");
    return;
  }

  setGptStatus("GPT API를 호출하고 있습니다.", "loading");
  els.gptSearchButton.disabled = true;

  try {
    const response = await fetch("/api/gpt-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        unit,
        markdown: state.documents.get(unit.id) ?? "",
        references: getReferences(unit.id),
        uploads: state.uploads[unit.id] || []
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "GPT API 호출에 실패했습니다.");

    state.lastGptResult = data.result;
    els.gptResult.value = data.result;
    setGptStatus("GPT 검색 결과가 준비되었습니다. 필요한 부분을 수정한 뒤 현재 Markdown에 반영할 수 있습니다.", "success");
    state.activeView = "gpt";
    renderActiveView();
  } catch (error) {
    setGptStatus(error.message, "warning");
  } finally {
    els.gptSearchButton.disabled = false;
  }
}

async function applyGptResult() {
  const unit = getActiveUnit();
  const result = els.gptResult.value.trim();
  if (!result) {
    setGptStatus("반영할 GPT 결과가 없습니다.", "warning");
    return;
  }

  setGptStatus("현재 Markdown 파일에 GPT 결과를 반영하고 있습니다.", "loading");
  try {
    const response = await fetch(`/api/analysis-units/${encodeURIComponent(unit.id)}/append`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heading: "GPT 검색 반영 결과",
        markdown: result
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Markdown 반영에 실패했습니다.");

    state.documents.set(unit.id, data.markdown);
    setGptStatus("현재 분석 단위 Markdown 파일에 반영되었습니다.", "success");
    state.activeView = "analysis";
    renderActiveView();
  } catch (error) {
    setGptStatus(`${error.message} 서버가 아닌 정적 서버로 실행 중이라면 .\\Start-Site.ps1로 다시 실행하세요.`, "warning");
  }
}

function addReference() {
  const unit = getActiveUnit();
  const reference = {
    title: els.referenceTitle.value.trim(),
    source: els.referenceSource.value.trim(),
    url: els.referenceUrl.value.trim(),
    memo: els.referenceMemo.value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!reference.title) return;

  state.references[unit.id] = [...getReferences(unit.id), reference];
  saveStoredReferences();
  els.referenceForm.reset();
  renderReferences();
}

function removeReference(unitId, index) {
  state.references[unitId] = getReferences(unitId).filter((_, itemIndex) => itemIndex !== index);
  saveStoredReferences();
  renderReferences();
}

function renderExportPreview() {
  els.exportPreview.innerHTML = markdownToHtml(buildCombinedMarkdown());
}

function downloadDoc() {
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: "Malgun Gothic", "Noto Sans KR", sans-serif; line-height: 1.65; }
          h1 { font-size: 24pt; }
          h2 { font-size: 17pt; margin-top: 24pt; }
          h3 { font-size: 13pt; margin-top: 16pt; }
          table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
          th, td { border: 1px solid #888; padding: 6pt; vertical-align: top; }
          th { background: #eef3f7; }
        </style>
      </head>
      <body>${markdownToHtml(buildCombinedMarkdown())}</body>
    </html>
  `;
  downloadBlob(html, "semiconductor-roadmap-report.doc", "application/msword;charset=utf-8");
}

function downloadMarkdown() {
  downloadBlob(buildCombinedMarkdown(), "semiconductor-roadmap-report.md", "text/markdown;charset=utf-8");
}

function buildCombinedMarkdown() {
  const chunks = [
    "# 중소기업 전략기술로드맵 AI Agent - 반도체 분야",
    "",
    "## AI Agent 역할",
    "",
    "반도체 분야 PM으로서 2024-2026년 정책, 산업, 시장, 기술, 지재권 및 중기부 지원과제 분석 결과를 종합하여 전략품목 후보군과 KPI 기반 R&D Dashboard를 작성한다.",
    "",
    "## 분석 단위",
    "",
    "| 구분 | 분석 단위 | 담당 역할 | 분석 범위 |",
    "| --- | --- | --- | --- |",
    ...state.units.map((unit) => `| ${levelLabels[unit.level] || unit.level} | ${unit.title} | ${unit.owner} | ${unit.scope.join(", ")} |`),
    ""
  ];

  state.units.forEach((unit) => {
    chunks.push(`\n---\n\n# ${unit.title}\n`);
    chunks.push(stripFrontMatter(state.documents.get(unit.id) ?? ""));
    chunks.push(uploadMarkdown(unit.id));
    chunks.push(referenceMarkdown(unit.id));
  });

  return chunks.join("\n");
}

function getFilteredUnits() {
  return getHierarchicalUnits().filter((unit) => {
    const markdown = state.documents.get(unit.id) ?? "";
    const references = getReferences(unit.id).map((item) => `${item.title} ${item.source} ${item.memo}`).join(" ");
    const uploads = (state.uploads[unit.id] || []).map((item) => item.originalName).join(" ");
    const matchesFilter = state.activeFilter === "all" || unit.status === state.activeFilter;
    const haystack = `${unit.title} ${unit.owner} ${unit.scope.join(" ")} ${unit.tags.join(" ")} ${references} ${uploads} ${markdown}`.toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query);
    return matchesFilter && matchesQuery;
  });
}

function getHierarchicalUnits() {
  const byParent = new Map();
  state.units.forEach((unit) => {
    const key = unit.parentId || "root";
    byParent.set(key, [...(byParent.get(key) || []), unit]);
  });

  const ordered = [];
  const visit = (parentId) => {
    (byParent.get(parentId) || []).forEach((unit) => {
      ordered.push(unit);
      visit(unit.id);
    });
  };

  visit("root");
  return ordered;
}

function getActiveUnit() {
  return state.units.find((item) => item.id === state.activeId);
}

function getReferences(unitId) {
  const unit = state.units.find((item) => item.id === unitId);
  return [...(unit?.references || []), ...(state.references[unitId] || [])];
}

function withReferenceSection(unitId, markdown) {
  return [markdown.trim(), uploadMarkdown(unitId), referenceMarkdown(unitId)].filter(Boolean).join("\n\n");
}

function uploadMarkdown(unitId) {
  const uploads = state.uploads[unitId] || [];
  if (!uploads.length) return "";
  return [
    "## 등록 원문 파일",
    "",
    ...uploads.map((file, index) => `${index + 1}. ${file.originalName} (${formatBytes(file.size)}, ${file.uploadedAt || ""})`)
  ].join("\n");
}

function referenceMarkdown(unitId) {
  const references = getReferences(unitId);
  if (!references.length) return "";
  return [
    "## 등록 참고문헌",
    "",
    ...references.map((reference, index) => {
      const source = reference.source ? `, ${reference.source}` : "";
      const url = reference.url ? `, ${reference.url}` : "";
      const memo = reference.memo ? `\n  - 활용 메모: ${reference.memo}` : "";
      return `${index + 1}. ${reference.title}${source}${url}${memo}`;
    })
  ].join("\n");
}

function loadStoredReferences() {
  try {
    return JSON.parse(localStorage.getItem("semiconductorRoadmapReferences") || "{}");
  } catch (error) {
    return {};
  }
}

function saveStoredReferences() {
  localStorage.setItem("semiconductorRoadmapReferences", JSON.stringify(state.references));
}

function setGptStatus(message, type) {
  els.gptStatus.textContent = message;
  els.gptStatus.className = `notice ${type || ""}`;
}

function setUploadStatus(message, type) {
  els.uploadStatus.textContent = message;
  els.uploadStatus.className = `notice ${type || ""}`;
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function markdownToHtml(markdown) {
  const body = stripFrontMatter(markdown);
  const lines = body.split(/\r?\n/);
  const html = [];
  let list = [];
  let orderedList = [];
  let table = [];

  const flushList = () => {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
    if (orderedList.length) {
      html.push(`<ol>${orderedList.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ol>`);
      orderedList = [];
    }
  };

  const flushTable = () => {
    if (!table.length) return;
    const rows = table
      .filter((row) => !/^(\s*\|?\s*:?-{3,}:?\s*)+\|?\s*$/.test(row))
      .map((row, index) => {
        const cells = row
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
        const tag = index === 0 ? "th" : "td";
        return `<tr>${cells.map((cell) => `<${tag}>${inlineMarkdown(cell)}</${tag}>`).join("")}</tr>`;
      });
    html.push(`<table>${rows.join("")}</table>`);
    table = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("|")) {
      flushList();
      table.push(line);
      continue;
    }

    flushTable();

    if (line.startsWith("- ")) {
      orderedList = [];
      list.push(line.slice(2));
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      list = [];
      orderedList.push(orderedMatch[1]);
      continue;
    }

    flushList();

    if (line.startsWith("# ")) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.trim() === "---") {
      html.push("<hr>");
    } else if (line.trim()) {
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  flushList();
  flushTable();
  return html.join("");
}

function stripFrontMatter(markdown) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusLabel(status) {
  return {
    draft: "초안",
    review: "검토",
    approved: "승인"
  }[status] ?? status;
}
