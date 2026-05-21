const state = {
  units: [],
  baseUnits: [],
  documents: new Map(),
  references: {},
  uploads: {},
  activeFilter: "all",
  activeFieldId: null,
  activeId: null,
  expandedIds: new Set(),
  activeView: "analysis",
  query: "",
  lastGptResult: ""
};

const levelLabels = {
  phase: "분석 단계",
  analysis: "하위 분석"
};

const levelOrder = {
  phase: 1,
  analysis: 2
};

const fallbackManifest = {
  project: {
    title: "중소기업 전략기술로드맵 AI Agent - 반도체·디스플레이 분야",
    subtitle: "분석 단위별 Markdown 기반 로드맵 작성 워크스페이스",
    version: "1.0.0",
    lastUpdated: "2026-05-20"
  },
  analysisUnits: []
};

const strategyFields = [
  {
    id: "ai",
    label: "AI",
    title: "중소기업 전략기술로드맵 AI Agent - AI 분야",
    subtitle: "AI 모델, 데이터, 응용서비스 기반 전략품목 로드맵",
    accent: "#2563eb",
    keywords: ["생성형 AI", "AI 반도체", "데이터", "SaaS"]
  },
  {
    id: "bio-medical",
    label: "바이오·의료",
    title: "중소기업 전략기술로드맵 AI Agent - 바이오·의료 분야",
    subtitle: "바이오헬스, 의료기기, 디지털 치료제 전략 로드맵",
    accent: "#0f766e",
    keywords: ["의료기기", "진단", "디지털헬스", "신약"]
  },
  {
    id: "semiconductor-display",
    label: "반도체·디스플레이",
    title: "중소기업 전략기술로드맵 AI Agent - 반도체·디스플레이 분야",
    subtitle: "분석 단위별 Markdown 기반 로드맵 작성 워크스페이스",
    accent: "#7c3aed",
    keywords: ["첨단패키징", "전력반도체", "디스플레이", "소부장"],
    usesManifest: true
  },
  {
    id: "next-communication",
    label: "차세대통신",
    title: "중소기업 전략기술로드맵 AI Agent - 차세대통신 분야",
    subtitle: "5G-Advanced, 6G, 네트워크 장비·서비스 전략 로드맵",
    accent: "#0369a1",
    keywords: ["6G", "오픈랜", "위성통신", "네트워크"]
  },
  {
    id: "advanced-materials",
    label: "첨단소재",
    title: "중소기업 전략기술로드맵 AI Agent - 첨단소재 분야",
    subtitle: "고기능 소재, 공급망, 소부장 자립화 전략 로드맵",
    accent: "#b45309",
    keywords: ["소재", "나노", "탄소", "세라믹"]
  },
  {
    id: "advanced-manufacturing",
    label: "첨단제조",
    title: "중소기업 전략기술로드맵 AI Agent - 첨단제조 분야",
    subtitle: "스마트공장, 공정혁신, 제조 AI 전략 로드맵",
    accent: "#4d7c0f",
    keywords: ["스마트공장", "공정", "디지털트윈", "검사"]
  },
  {
    id: "robot",
    label: "로봇",
    title: "중소기업 전략기술로드맵 AI Agent - 로봇 분야",
    subtitle: "산업·서비스 로봇과 핵심부품 전략 로드맵",
    accent: "#0e7490",
    keywords: ["산업로봇", "서비스로봇", "AMR", "그리퍼"]
  },
  {
    id: "advanced-mobility",
    label: "첨단모빌리티",
    title: "중소기업 전략기술로드맵 AI Agent - 첨단모빌리티 분야",
    subtitle: "자율주행, 전동화, 미래 이동서비스 전략 로드맵",
    accent: "#be123c",
    keywords: ["자율주행", "전장", "UAM", "센서"]
  },
  {
    id: "climate-energy",
    label: "기후·에너지",
    title: "중소기업 전략기술로드맵 AI Agent - 기후·에너지 분야",
    subtitle: "탄소중립, 재생에너지, 에너지 효율 전략 로드맵",
    accent: "#15803d",
    keywords: ["탄소중립", "수소", "재생에너지", "효율"]
  },
  {
    id: "secondary-battery",
    label: "이차전지",
    title: "중소기업 전략기술로드맵 AI Agent - 이차전지 분야",
    subtitle: "배터리 소재, 셀·팩, 재사용·재활용 전략 로드맵",
    accent: "#ca8a04",
    keywords: ["전극소재", "BMS", "전고체", "재활용"]
  },
  {
    id: "cyber-security",
    label: "사이버보안",
    title: "중소기업 전략기술로드맵 AI Agent - 사이버보안 분야",
    subtitle: "제로트러스트, AI 보안, 산업보안 전략 로드맵",
    accent: "#4338ca",
    keywords: ["제로트러스트", "클라우드", "AI 보안", "OT"]
  },
  {
    id: "quantum",
    label: "양자",
    title: "중소기업 전략기술로드맵 AI Agent - 양자 분야",
    subtitle: "양자컴퓨팅, 통신, 센싱 기반 전략 로드맵",
    accent: "#9333ea",
    keywords: ["양자컴퓨팅", "양자통신", "양자센서", "암호"]
  },
  {
    id: "space",
    label: "우주",
    title: "중소기업 전략기술로드맵 AI Agent - 우주 분야",
    subtitle: "위성, 발사체, 우주데이터 활용 전략 로드맵",
    accent: "#334155",
    keywords: ["위성", "발사체", "우주부품", "관측데이터"]
  }
];

const els = {
  fieldLanding: document.querySelector("#fieldLanding"),
  fieldGrid: document.querySelector("#fieldGrid"),
  appShell: document.querySelector("#appShell"),
  brandEyebrow: document.querySelector("#brandEyebrow"),
  brandTitle: document.querySelector("#brandTitle"),
  backToFieldsButton: document.querySelector("#backToFieldsButton"),
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
  roleTitle: document.querySelector("#roleTitle"),
  roleBody: document.querySelector("#roleBody"),
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
  openaiApiKey: document.querySelector("#openaiApiKey"),
  saveApiKeyButton: document.querySelector("#saveApiKeyButton"),
  clearApiKeyButton: document.querySelector("#clearApiKeyButton"),
  apiKeyStatus: document.querySelector("#apiKeyStatus"),
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
  state.baseUnits = manifest.analysisUnits;
  state.references = loadStoredReferences();
  state.units = state.baseUnits;
  await loadDocuments(state.baseUnits);

  bindEvents();
  hydrateApiKey();
  renderFieldLanding();
  showLanding();
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

async function loadDocuments(units) {
  await Promise.all(
    units.map(async (unit) => {
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
  els.fieldGrid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-field-id]");
    if (!button) return;
    await selectField(button.dataset.fieldId);
  });

  els.backToFieldsButton.addEventListener("click", showLanding);

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
  els.saveApiKeyButton.addEventListener("click", saveApiKey);
  els.clearApiKeyButton.addEventListener("click", clearApiKey);
  els.referenceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addReference();
  });

  els.gptSearchButton.addEventListener("click", runGptSearch);
  els.applyGptButton.addEventListener("click", applyGptResult);
  els.downloadDocButton.addEventListener("click", downloadDoc);
  els.downloadMarkdownButton.addEventListener("click", downloadMarkdown);
}

function renderFieldLanding() {
  els.fieldGrid.innerHTML = strategyFields
    .map(
      (field, index) => `
        <button class="field-card" data-field-id="${field.id}" style="--field-accent: ${field.accent}" type="button">
          <span class="field-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="field-icon" aria-hidden="true">${fieldIcon(field.id)}</span>
          <strong>${escapeHtml(field.label)}</strong>
          <span>${escapeHtml(field.subtitle)}</span>
        </button>
      `
    )
    .join("");
}

function showLanding() {
  state.activeFieldId = null;
  els.fieldLanding.classList.remove("is-hidden");
  els.appShell.classList.add("is-hidden");
}

async function selectField(fieldId) {
  const field = getField(fieldId);
  if (!field) return;

  state.activeFieldId = field.id;
  state.activeFilter = "all";
  state.activeView = "analysis";
  state.query = "";
  els.searchInput.value = "";
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.filter === "all"));

  if (field.usesManifest) {
    state.units = state.baseUnits;
    state.expandedIds = new Set();
  } else {
    state.units = createTemplateUnits(field);
    state.expandedIds = new Set([state.units[0]?.id].filter(Boolean));
    state.units.forEach((unit) => {
      state.documents.set(unit.id, createTemplateMarkdown(field, unit));
    });
  }

  state.activeId = state.units[0]?.id ?? null;
  renderProject(field);
  renderFieldWorkspace(field);
  els.fieldLanding.classList.add("is-hidden");
  els.appShell.classList.remove("is-hidden");
  render();
  renderActiveView();
  await loadUploads();
}

function hydrateApiKey() {
  const savedKey = localStorage.getItem("strategyRoadmapOpenAiKey") || localStorage.getItem("semiconductorRoadmapOpenAiKey") || "";
  if (savedKey) {
    els.openaiApiKey.value = savedKey;
    setApiKeyStatus("저장된 API 키를 사용합니다. 이 키는 현재 브라우저에만 저장되어 있습니다.", "success");
  }
}

function renderProject(project) {
  els.projectTitle.textContent = project.title;
  els.projectSubtitle.textContent = project.subtitle;
  els.version.textContent = `v${project.version || "1.0.0"}`;
  els.lastUpdated.textContent = project.lastUpdated || fallbackManifest.project.lastUpdated;
  els.brandEyebrow.textContent = `${getActiveField()?.label || "전략분야"} Roadmap PM`;
  els.brandTitle.textContent = project.title;
}

function renderFieldWorkspace(field) {
  els.roleTitle.textContent = `${field.label} 분야 PM Agent`;
  els.roleBody.textContent = `${field.label} 분야의 환경분석, 지재권*지원과제 분석, 전략품목 후보군 도출을 연결해 중소기업 전략기술로드맵 작성을 지원합니다.`;
  els.gptQuery.placeholder = `예: 2024-2026년 ${field.label} 분야 정책, 시장, 기술 이슈와 중소기업 R&D 기회영역을 Markdown 표로 정리해줘.`;
}

function saveApiKey() {
  const apiKey = els.openaiApiKey.value.trim();
  if (!apiKey) {
    setApiKeyStatus("저장할 API 키를 입력하세요.", "warning");
    return;
  }

  localStorage.setItem("strategyRoadmapOpenAiKey", apiKey);
  setApiKeyStatus("API 키를 이 브라우저에 저장했습니다.", "success");
}

function clearApiKey() {
  localStorage.removeItem("strategyRoadmapOpenAiKey");
  localStorage.removeItem("semiconductorRoadmapOpenAiKey");
  els.openaiApiKey.value = "";
  setApiKeyStatus("저장된 API 키를 삭제했습니다.", "warning");
}

function render() {
  renderMetrics();
  renderUnitList();
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
      if (unit.parentId === "environment-analysis") acc.environment += 1;
      if (unit.id === "ip-rnd-analysis") acc.strategy += 1;
      if (unit.id === "strategic-item-candidates") acc.dashboard += 1;
      return acc;
    },
    { total: 0, environment: 0, strategy: 0, dashboard: 0 }
  );

  els.totalCount.textContent = counts.total;
  els.environmentCount.textContent = counts.environment;
  els.strategyCount.textContent = counts.strategy;
  els.dashboardCount.textContent = counts.dashboard;
}

function renderUnitList() {
  const visibleUnits = getVisibleUnits();

  if (!visibleUnits.length) {
    els.unitList.innerHTML = `<div class="empty-state">검색 조건에 맞는 분석 단위가 없습니다.</div>`;
    return;
  }

  els.unitList.innerHTML = visibleUnits
    .map(({ unit, depth, hasChildren }) => {
      const tags = (unit.tags || []).slice(0, 2).join(", ");
      const indent = `level-${depth + 1}`;
      const isExpanded = state.expandedIds.has(unit.id);
      return `
        <button class="unit-button ${indent} ${unit.id === state.activeId ? "is-active" : ""}" data-id="${unit.id}" type="button">
          <span class="unit-heading-row">
            <span class="level-label">${levelLabels[unit.level] || unit.level}</span>
            ${hasChildren ? `<span class="disclosure ${isExpanded ? "is-open" : ""}" aria-hidden="true">▾</span>` : ""}
          </span>
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
      const unitId = button.dataset.id;
      const hasChildren = state.units.some((unit) => unit.parentId === unitId);
      state.activeId = unitId;
      if (hasChildren) {
        if (state.expandedIds.has(unitId)) {
          state.expandedIds.delete(unitId);
        } else {
          state.expandedIds.add(unitId);
        }
      }
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
  els.selectedTags.innerHTML = [...(unit.scope || []), ...(unit.tags || [])]
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
  const apiKey = els.openaiApiKey.value.trim() || localStorage.getItem("semiconductorRoadmapOpenAiKey") || "";
  if (!query) {
    setGptStatus("검색어를 입력하세요.", "warning");
    return;
  }
  if (!apiKey) {
    setGptStatus("GPT 검색을 사용하려면 본인의 OpenAI API 키를 입력한 뒤 키 저장을 누르세요.", "warning");
    return;
  }

  setGptStatus("GPT API를 호출하고 있습니다.", "loading");
  els.gptSearchButton.disabled = true;

  try {
    const response = await fetch("/api/gpt-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OpenAI-API-Key": apiKey
      },
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
  const field = getActiveField();
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
  downloadBlob(html, `${field?.id || "strategy"}-roadmap-report.doc`, "application/msword;charset=utf-8");
}

function downloadMarkdown() {
  const field = getActiveField();
  downloadBlob(buildCombinedMarkdown(), `${field?.id || "strategy"}-roadmap-report.md`, "text/markdown;charset=utf-8");
}

function buildCombinedMarkdown() {
  const field = getActiveField() || strategyFields[2];
  const chunks = [
    `# ${field.title}`,
    "",
    "## AI Agent 역할",
    "",
    `${field.label} 분야 PM으로서 2024-2026년 정책, 산업, 시장, 기술, 지재권 및 중기부 지원과제 분석 결과를 종합하여 전략품목 후보군을 도출한다.`,
    "",
    "## 분석 단위",
    "",
    "| 구분 | 분석 단위 | 담당 역할 | 분석 범위 |",
    "| --- | --- | --- | --- |",
    ...state.units.map((unit) => `| ${levelLabels[unit.level] || unit.level} | ${unit.title} | ${unit.owner} | ${(unit.scope || []).join(", ")} |`),
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

function getField(fieldId) {
  return strategyFields.find((field) => field.id === fieldId);
}

function getActiveField() {
  return getField(state.activeFieldId);
}

function createTemplateUnits(field) {
  const prefix = field.id;
  const owner = `${field.label} 분야 PM Agent`;
  return [
    {
      id: `${prefix}-environment-analysis`,
      title: `${field.label} 분야 환경분석`,
      level: "phase",
      status: "draft",
      owner,
      scope: ["정책", "산업", "시장", "기술"],
      tags: ["환경분석", field.label, "전략기술로드맵"]
    },
    {
      id: `${prefix}-policy-regulation`,
      parentId: `${prefix}-environment-analysis`,
      title: "정책·규제·지원사업 분석",
      level: "analysis",
      status: "draft",
      owner: "정책 환경 분석 Agent",
      scope: ["정부정책", "규제", "R&D 지원사업", "인증"],
      tags: ["정책", "규제", "지원사업"]
    },
    {
      id: `${prefix}-market-industry`,
      parentId: `${prefix}-environment-analysis`,
      title: "시장·산업·공급망 분석",
      level: "analysis",
      status: "draft",
      owner: "시장·산업 분석 Agent",
      scope: ["시장규모", "수요처", "공급망", "경쟁구도"],
      tags: ["시장", "산업", "공급망"]
    },
    {
      id: `${prefix}-technology-ip`,
      parentId: `${prefix}-environment-analysis`,
      title: "기술·특허·표준 분석",
      level: "analysis",
      status: "draft",
      owner: "기술·IP 분석 Agent",
      scope: ["핵심기술", "논문", "특허", "표준"],
      tags: ["기술", "특허", "표준"]
    },
    {
      id: `${prefix}-strategic-item-candidates`,
      title: "전략품목 후보군 도출",
      level: "phase",
      status: "draft",
      owner: "전략품목 구성 Agent",
      scope: ["전략품목", "우선순위", "중소기업 적합성", "사업화"],
      tags: ["전략품목", "후보군", "우선순위"]
    },
    {
      id: `${prefix}-dashboard-roadmap`,
      title: `${field.label} 분야 로드맵 및 KPI Dashboard`,
      level: "phase",
      status: "draft",
      owner,
      scope: ["로드맵", "KPI", "연차별 추진계획", "성과관리"],
      tags: ["로드맵", "KPI", "R&D"]
    }
  ];
}

function createTemplateMarkdown(field, unit) {
  const keywords = field.keywords.join(", ");
  return [
    "---",
    `title: ${unit.title}`,
    `owner: ${unit.owner}`,
    `status: ${unit.status}`,
    "---",
    "",
    `# ${unit.title}`,
    "",
    `${unit.owner}는 ${field.label} 분야 중소기업 전략기술로드맵 수립을 위해 ${unit.scope.join(", ")} 관점의 분석 초안을 작성한다.`,
    "",
    "## 분석 초점",
    "",
    ...unit.scope.map((item) => `- ${item}: ${field.label} 분야의 중소기업 기회영역과 정책 반영 방향을 정리`),
    "",
    "## 우선 검토 키워드",
    "",
    `- ${keywords}`,
    "",
    "## GPT 검색 프롬프트 예시",
    "",
    `- 2024-2026년 ${field.label} 분야의 정책, 시장, 기술 변화를 중소기업 R&D 관점으로 정리해줘.`,
    `- ${field.label} 분야 전략품목 후보군을 시장성, 기술성, 정책부합성 기준으로 비교해줘.`,
    ""
  ].join("\n");
}

function isEnvironmentUnit(unit) {
  const haystack = `${unit.id} ${unit.title} ${(unit.scope || []).join(" ")} ${(unit.tags || []).join(" ")}`;
  return includesAny([haystack], ["환경분석", "정책", "산업", "시장", "기술"]);
}

function includesAny(values, needles) {
  const haystack = values.join(" ");
  return needles.some((needle) => haystack.includes(needle));
}

function fieldIcon(fieldId) {
  const icons = {
    ai: '<svg viewBox="0 0 24 24"><path d="M8 4h8v3h3v10h-3v3H8v-3H5V7h3V4Zm2 5v6h4.8v-1.8H12V9h-2Zm6 0v6h2V9h-2Z"/></svg>',
    "bio-medical": '<svg viewBox="0 0 24 24"><path d="M11 3h2v6h6v2h-6v10h-2V11H5V9h6V3Zm6.5 11a3.5 3.5 0 1 1-3.5 3.5A3.5 3.5 0 0 1 17.5 14Z"/></svg>',
    "semiconductor-display": '<svg viewBox="0 0 24 24"><path d="M7 7h10v10H7V7Zm2 2v6h6V9H9Zm9-6h2v3h2v2h-2v3h2v2h-2v3h2v2h-2v3h-2v-3h-3v3h-2v-3h-3v3H8v-3H5v3H3v-3H1v-2h2v-3H1v-2h2V8H1V6h2V3h2v3h3V3h2v3h3V3h2v3h3V3Z"/></svg>',
    "next-communication": '<svg viewBox="0 0 24 24"><path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-5-4 1.4 1.4a5.1 5.1 0 0 1 7.2 0L17 14a7 7 0 0 0-10 0Zm-4-4 1.4 1.4a10.8 10.8 0 0 1 15.2 0L21 10A12.8 12.8 0 0 0 3 10Zm4-6 1.4 1.4a5.1 5.1 0 0 0 7.2 0L17 4A7 7 0 0 1 7 4Z"/></svg>',
    "advanced-materials": '<svg viewBox="0 0 24 24"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 5 2.8-5 2.8-5-2.8 5-2.8ZM5 8.8l6 3.4v6.9l-6-3.3v-7Zm14 7-6 3.3v-6.9l6-3.4v7Z"/></svg>',
    "advanced-manufacturing": '<svg viewBox="0 0 24 24"><path d="M3 21V9l5 3V9l5 3V5h8v16H3Zm12-2h2v-2h-2v2Zm-5 0h2v-2h-2v2Zm-5 0h2v-2H5v2Zm12-4h2V7h-2v8Z"/></svg>',
    robot: '<svg viewBox="0 0 24 24"><path d="M11 2h2v3h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h4V2ZM7 7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H7Zm2 3h2v2H9v-2Zm4 0h2v2h-2v-2Zm-4 5v-2h6v2H9Z"/></svg>',
    "advanced-mobility": '<svg viewBox="0 0 24 24"><path d="M5 11 7 6h10l2 5 2 1v5h-2v2h-3v-2H8v2H5v-2H3v-5l2-1Zm2.4-3-1.1 3h11.4l-1.1-3H7.4ZM7 14.2A1.8 1.8 0 1 0 7 17.8a1.8 1.8 0 0 0 0-3.6Zm10 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z"/></svg>',
    "climate-energy": '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4-4 7h3l-1 5 5-8h-3l1-4h-1Z"/></svg>',
    "secondary-battery": '<svg viewBox="0 0 24 24"><path d="M8 4h8v2h2v14H6V6h2V4Zm0 4v10h8V8H8Zm5 1-4 5h3l-1 3 4-5h-3l1-3Z"/></svg>',
    "cyber-security": '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2 6 2.3V11c0 3.9-2.4 7.4-6 8.8-3.6-1.4-6-4.9-6-8.8V6.5l6-2.3Zm-1 5.8h2v4h-2v-4Zm0 6h2v2h-2v-2Z"/></svg>',
    quantum: '<svg viewBox="0 0 24 24"><path d="M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0-8c2 0 3.7 3 4.4 7.2C20.4 10 23 11.4 23 13s-2.6 3-6.6 3.8C15.7 21 14 24 12 24s-3.7-3-4.4-7.2C3.6 16 1 14.6 1 13s2.6-3 6.6-3.8C8.3 5 10 2 12 2Zm0 2c-.8 0-1.9 1.8-2.5 4.8a25 25 0 0 1 5 0C13.9 5.8 12.8 4 12 4Zm0 18c.8 0 1.9-1.8 2.5-4.8a25 25 0 0 1-5 0c.6 3 1.7 4.8 2.5 4.8ZM3 13c0 .6 1.6 1.4 4.3 2a25.4 25.4 0 0 1 0-4C4.6 11.6 3 12.4 3 13Zm18 0c0-.6-1.6-1.4-4.3-2a25.4 25.4 0 0 1 0 4c2.7-.6 4.3-1.4 4.3-2Z"/></svg>',
    space: '<svg viewBox="0 0 24 24"><path d="M12 2c3 2.2 4.6 4.6 4.6 7.2 0 2.2-1.1 4-2.6 5.3l1 4.5-3-1.8L9 19l1-4.5a7 7 0 0 1-2.6-5.3C7.4 6.6 9 4.2 12 2Zm0 3.1c-1.7 1.6-2.6 3-2.6 4.1A4.5 4.5 0 0 0 12 13a4.5 4.5 0 0 0 2.6-3.8c0-1.1-.9-2.5-2.6-4.1ZM5 16l3-1-1 4-4 3 2-6Zm14 0 2 6-4-3-1-4 3 1Z"/></svg>'
  };
  return icons[fieldId] || icons.ai;
}

function getVisibleUnits() {
  const byParent = new Map();
  state.units.forEach((unit) => {
    const key = unit.parentId || "root";
    byParent.set(key, [...(byParent.get(key) || []), unit]);
  });

  const matches = (unit) => {
    const markdown = state.documents.get(unit.id) ?? "";
    const references = getReferences(unit.id).map((item) => `${item.title} ${item.source} ${item.memo}`).join(" ");
    const uploads = (state.uploads[unit.id] || []).map((item) => item.originalName).join(" ");
    const matchesFilter = state.activeFilter === "all" || unit.status === state.activeFilter;
    const haystack = `${unit.title} ${unit.owner} ${(unit.scope || []).join(" ")} ${(unit.tags || []).join(" ")} ${references} ${uploads} ${markdown}`.toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query);
    return matchesFilter && matchesQuery;
  };

  const hasMatchingDescendant = (unit) => {
    return (byParent.get(unit.id) || []).some((child) => matches(child) || hasMatchingDescendant(child));
  };

  const visible = [];
  const visit = (parentId, depth) => {
    (byParent.get(parentId) || []).forEach((unit) => {
      const children = byParent.get(unit.id) || [];
      const shouldShow = matches(unit) || hasMatchingDescendant(unit);
      if (!shouldShow) return;

      visible.push({ unit, depth, hasChildren: children.length > 0 });
      if (children.length && (state.expandedIds.has(unit.id) || state.query)) {
        visit(unit.id, depth + 1);
      }
    });
  };

  visit("root", 0);
  return visible;
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

function setApiKeyStatus(message, type) {
  els.apiKeyStatus.textContent = message;
  els.apiKeyStatus.className = `helper-text ${type || ""}`;
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
