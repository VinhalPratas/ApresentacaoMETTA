const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const monthOptions = [
  { value: "all", label: "Todos os meses" },
  { value: "2026-01", label: "Janeiro/2026" },
  { value: "2026-02", label: "Fevereiro/2026" },
  { value: "2026-03", label: "Março/2026" },
  { value: "2026-04", label: "Abril/2026" },
  { value: "2026-05", label: "Maio/2026" },
  { value: "2026-06", label: "Junho/2026" },
  { value: "2026-07", label: "Julho/2026" },
  { value: "2026-08", label: "Agosto/2026" },
  { value: "2026-09", label: "Setembro/2026" },
  { value: "2026-10", label: "Outubro/2026" },
  { value: "2026-11", label: "Novembro/2026" },
  { value: "2026-12", label: "Dezembro/2026" },
];

const convenios = ["Unimed", "Ipasgo", "Bradesco", "SulAmérica", "Amil", "Particular"];
const exames = [
  "Tomografia de abdome total",
  "Ressonância de crânio",
  "Ultrassom abdominal",
  "Angiotomografia coronariana",
  "Ressonância de coluna lombar",
  "Tomografia de tórax",
];
const statusList = [
  { label: "Faturado", color: "#1c8b52" },
  { label: "Enviado", color: "#b7791f" },
  { label: "Recebido", color: "#2463eb" },
  { label: "Glosado", color: "#c2413b" },
  { label: "Em recurso", color: "#7c3aed" },
  { label: "Recuperado", color: "#15803d" },
];
const motivos = [
  "Falta de autorização",
  "Documentação incompleta",
  "Erro de cadastro",
  "Divergência de procedimento",
  "Prazo vencido",
  "Falha do convênio",
  "Outros",
];
const statusProcessoGlosa = ["Aberta", "Em análise", "Recurso enviado", "Deferida", "Indeferida", "Recuperada"];
const storageKey = "metta-faturamento-state-v4";
const oldStorageKey = "metta-faturamento-state";
const previousStorageKey = "metta-faturamento-state-v2";
const previousStorageKeyV3 = "metta-faturamento-state-v3";
let dashboardFilters = { month: "2026-06", convenio: "all" };

const sampleState = {
  faturamentos: [
    guide("GUIA-TESTE-001", "Paciente Teste", "Unimed", "2026-06-12", "2026-06-12", exames[0], 1200, 900, "Usuario Teste", "Glosado"),
  ],
  glosas: [
    glosa("GUIA-TESTE-001", "Falta de autorização", 300, "2026-06-12", "Usuario Teste", "2026-06-17", "Aberta"),
  ],
  months: [
    { month: "Jan", faturado: 0, recebido: 0, glosado: 0 },
    { month: "Fev", faturado: 0, recebido: 0, glosado: 0 },
    { month: "Mar", faturado: 0, recebido: 0, glosado: 0 },
    { month: "Abr", faturado: 0, recebido: 0, glosado: 0 },
    { month: "Mai", faturado: 0, recebido: 0, glosado: 0 },
    { month: "Jun", faturado: 1200, recebido: 0, glosado: 300 },
  ],
};

let state = loadState();
let editingGlosaIndex = null;

function guide(guia, paciente, convenio, dataExame, dataFaturamento, exame, valorOriginal, valorRecebido, responsavel, status) {
  return { guia, paciente, convenio, dataExame, dataFaturamento, exame, valorOriginal, valorRecebido, responsavel, status };
}

function glosa(guia, motivo, valor, data, responsavel, prazo, statusProcesso = "Aberta") {
  return { guia, motivo, valor, data, responsavel, prazo, statusProcesso };
}

function loadState() {
  localStorage.removeItem(oldStorageKey);
  localStorage.removeItem(previousStorageKey);
  localStorage.removeItem(previousStorageKeyV3);
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : structuredClone(sampleState);
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function byId(id) {
  return document.getElementById(id);
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function render() {
  hydrateSelects();
  renderDashboard();
  renderBilling();
  renderGlosas();
  renderRanking();
  renderResources();
  renderDirector();
  renderDocuments();
}

function hydrateSelects() {
  fillSelect(document.querySelector("[name='convenio']"), convenios);
  fillSelect(document.querySelector("[name='exame']"), exames);
  fillSelect(document.querySelector("[name='status']"), statusList.map((item) => item.label));
  document.querySelectorAll("[name='guia']").forEach((select) => fillSelect(select, state.faturamentos.map((item) => item.guia)));
  const motivoSelect = document.querySelector("#glosaForm [name='motivo']");
  fillSelect(motivoSelect, motivos);
  fillSelect(document.querySelector("#glosaForm [name='statusProcesso']"), statusProcessoGlosa);
  fillSelectWithLabels(byId("dashboardMonth"), monthOptions);
  fillSelect(byId("dashboardConvenio"), ["Todos os convênios", ...convenios]);
  byId("dashboardMonth").value = dashboardFilters.month;
  byId("dashboardConvenio").value = dashboardFilters.convenio === "all" ? "Todos os convênios" : dashboardFilters.convenio;
}

function fillSelect(select, options) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = options.map((option) => `<option value="${option}">${option}</option>`).join("");
  if (options.includes(current)) select.value = current;
}

function fillSelectWithLabels(select, options) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("");
  if (options.some((option) => option.value === current)) select.value = current;
}

function renderDashboard() {
  const filteredBillings = getFilteredBillings();
  const filteredGuias = filteredBillings.map((item) => item.guia);
  const filteredGlosas = getFilteredGlosas(filteredGuias);
  const faturado = sum(filteredBillings, (item) => getValorOriginal(item));
  const recebido = sum(filteredBillings, (item) => getValorRecebido(item));
  const glosado = sum(filteredGlosas, (item) => item.valor);
  const emRecurso = sum(filteredGlosas.filter((item) => ["Em análise", "Recurso enviado"].includes(item.statusProcesso)), (item) => item.valor);
  const recuperado = sum(filteredGlosas.filter((item) => ["Deferida", "Recuperada"].includes(item.statusProcesso)), (item) => item.valor);

  byId("kpiFaturado").textContent = currency.format(faturado);
  byId("kpiRecebido").textContent = currency.format(recebido);
  byId("kpiGlosado").textContent = currency.format(glosado);
  byId("kpiRecurso").textContent = currency.format(emRecurso);
  byId("kpiRecuperado").textContent = currency.format(recuperado);
  byId("kpiTaxaGlosa").textContent = percent.format(glosado / Math.max(faturado, 1));

  const worst = getRanking(filteredBillings, filteredGlosas)[0] || emptyRanking();
  byId("worstConvenio").innerHTML = `<span>${worst.convenio}</span><strong>${percent.format(worst.taxa)}</strong><p>${currency.format(worst.glosado)} glosados de ${currency.format(worst.faturado)} faturados.</p>`;
  byId("topExamesGlosados").innerHTML = getTopExames(filteredGlosas).map((item) => `<div class="rank-item"><span>${item.exame}</span><strong>${currency.format(item.valor)}</strong></div>`).join("");
  byId("smartAlerts").innerHTML = getAlerts().map((text) => `<div class="alert">${text}</div>`).join("");
  renderMonthlyConvenioTable();
  drawMonthlyChart();
}

function renderBilling() {
  byId("billingTable").innerHTML = state.faturamentos.map((item) => `
    <tr>
      <td>${item.guia}</td>
      <td>${item.paciente}</td>
      <td>${item.convenio}</td>
      <td>${item.exame}</td>
      <td>${currency.format(getValorOriginal(item))}</td>
      <td>${currency.format(getValorRecebido(item))}</td>
      <td>${currency.format(getValorOriginal(item) - getValorRecebido(item))}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${item.responsavel}</td>
    </tr>
  `).join("");
}

function renderGlosas() {
  byId("glosaTable").innerHTML = state.glosas.map((item, index) => {
    const billing = findBilling(item.guia);
    return `
      <tr>
        <td>${item.guia}</td>
        <td>${billing?.convenio || "Nao localizado"}</td>
        <td>${item.motivo}</td>
        <td>${currency.format(item.valor)}</td>
        <td>${formatDate(item.data)}</td>
        <td>${item.responsavel}</td>
        <td>${formatDate(item.prazo)}</td>
        <td>${processBadge(item.statusProcesso || "Aberta")}</td>
        <td>
          <div class="row-actions">
            <button class="table-button" type="button" data-edit-glosa="${index}">Editar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderRanking() {
  byId("rankingTable").innerHTML = getRanking().map((item) => `
    <tr>
      <td>${item.convenio}</td>
      <td>${currency.format(item.faturado)}</td>
      <td>${currency.format(item.glosado)}</td>
      <td>${percent.format(item.taxa)}</td>
      <td>${item.taxa > 0.08 ? "Critico" : item.taxa > 0.03 ? "Acompanhar" : "Estavel"}</td>
    </tr>
  `).join("");
}

function renderResources() {
  byId("resourceCards").innerHTML = state.glosas.map((item) => {
    const billing = findBilling(item.guia);
    const days = daysUntil(item.prazo);
    const alert = days <= 1 ? "Recurso vence amanha" : days <= 5 ? `Recurso vence em ${days} dias` : `Prazo em ${days} dias`;
    return `
      <article class="resource-card">
        <h3>${item.guia} - ${billing?.convenio || "Convênio"}</h3>
        <p><strong>Carta de recurso:</strong> Solicitamos reanalise da glosa por ${item.motivo.toLowerCase()} referente ao exame ${billing?.exame || "informado"}.</p>
        <p><strong>Justificativa:</strong> Documentacao clinica e faturamento anexados para comprovacao do atendimento.</p>
        <p><strong>Anexos:</strong> autorizacao, pedido medico, laudo, imagens e conta faturada.</p>
        <p><strong>Status:</strong> ${item.statusProcesso || "Aberta"}</p>
        <span class="deadline">${alert}</span>
      </article>
    `;
  }).join("");
}

function renderDirector() {
  const glosado = sum(state.glosas, (item) => item.valor);
  const recebido = sum(state.faturamentos, (item) => getValorRecebido(item));
  const faturado = sum(state.faturamentos, (item) => getValorOriginal(item));
  const recuperado = sum(state.glosas.filter((item) => ["Deferida", "Recuperada"].includes(item.statusProcesso)), (item) => item.valor);
  const bestWorker = getWorkerPerformance()[0];
  const bestExam = [...state.faturamentos].sort((a, b) => getValorOriginal(b) - getValorOriginal(a))[0];
  const worst = getRanking()[0];
  const cards = [
    ["Valor original", currency.format(faturado), "Total faturado antes de recebimentos e glosas."],
    ["Valor recebido", currency.format(recebido), "Total efetivamente recebido pela clínica."],
    ["Perda por glosa", currency.format(glosado), "Valor ainda em risco financeiro."],
    ["Valor recuperado", currency.format(recuperado), "Resultado de recursos deferidos."],
    ["Convênio problemático", worst.convenio, `${percent.format(worst.taxa)} de glosa no período.`],
    ["Menor índice de erro", bestWorker.name, `${bestWorker.errors} ocorrencia(s) ligada(s) ao responsavel.`],
    ["Maior retorno financeiro", bestExam.exame, currency.format(getValorOriginal(bestExam))],
  ];
  byId("directorInsights").innerHTML = cards.map(([title, value, detail]) => `<article class="director-card"><h3>${title}</h3><strong>${value}</strong><p>${detail}</p></article>`).join("");
}

function renderDocuments() {
  byId("documentTable").innerHTML = state.faturamentos.map((item, index) => `
    <tr>
      <td>${item.guia}</td>
      <td>${index % 4 === 1 ? "Pendente" : "Vinculada"}</td>
      <td>${index % 5 === 2 ? "Ilegivel" : "OK"}</td>
      <td>Assinado</td>
      <td>${item.exame.includes("Ultrassom") ? "Sem PACS" : "PACS"}</td>
      <td>${statusBadge(item.status)}</td>
    </tr>
  `).join("");
}

function statusBadge(status) {
  const item = statusList.find((entry) => entry.label === status) || statusList[0];
  return `<span class="status" style="color:${item.color}"><span class="dot"></span>${status}</span>`;
}

function processBadge(status) {
  const colors = {
    "Aberta": "#c2413b",
    "Em análise": "#b7791f",
    "Recurso enviado": "#2463eb",
    "Deferida": "#047d7c",
    "Indeferida": "#7c3aed",
    "Recuperada": "#15803d",
  };
  return `<span class="status" style="color:${colors[status] || "#047d7c"}"><span class="dot"></span>${status}</span>`;
}

function findBilling(guia) {
  return state.faturamentos.find((item) => item.guia === guia);
}

function getFilteredBillings() {
  return state.faturamentos.filter((item) => {
    const monthMatch = dashboardFilters.month === "all" || item.dataFaturamento.startsWith(dashboardFilters.month);
    const convenioMatch = dashboardFilters.convenio === "all" || item.convenio === dashboardFilters.convenio;
    return monthMatch && convenioMatch;
  });
}

function getFilteredGlosas(allowedGuias) {
  return state.glosas.filter((item) => allowedGuias.includes(item.guia));
}

function getValorOriginal(item) {
  return Number(item.valorOriginal ?? item.valor ?? 0);
}

function getValorRecebido(item) {
  return Number(item.valorRecebido ?? (["Recebido", "Recuperado"].includes(item.status) ? getValorOriginal(item) : 0));
}

function getRanking(billings = state.faturamentos, glosas = state.glosas) {
  return convenios.map((convenio) => {
    const faturados = billings.filter((item) => item.convenio === convenio);
    const guias = faturados.map((item) => item.guia);
    const faturado = sum(faturados, (item) => getValorOriginal(item));
    const glosado = sum(glosas.filter((item) => guias.includes(item.guia)), (item) => item.valor);
    return { convenio, faturado, glosado, taxa: glosado / Math.max(faturado, 1) };
  }).filter((item) => item.faturado > 0 || item.glosado > 0).sort((a, b) => b.taxa - a.taxa);
}

function emptyRanking() {
  return { convenio: "Sem dados", faturado: 0, glosado: 0, taxa: 0 };
}

function getTopExames(glosas = state.glosas) {
  const totals = {};
  glosas.forEach((item) => {
    const billing = findBilling(item.guia);
    const exame = billing?.exame || "Guia externa";
    totals[exame] = (totals[exame] || 0) + item.valor;
  });
  return Object.entries(totals).map(([exame, valor]) => ({ exame, valor })).sort((a, b) => b.valor - a.valor).slice(0, 4);
}

function renderMonthlyConvenioTable() {
  const rows = getMonthlyConvenioStats();
  byId("monthlyConvenioTable").innerHTML = rows.map((item) => `
    <tr>
      <td>${item.month}</td>
      <td>${item.convenio}</td>
      <td>${currency.format(item.faturado)}</td>
      <td>${currency.format(item.recebido)}</td>
      <td>${currency.format(item.glosado)}</td>
      <td>${percent.format(item.taxa)}</td>
    </tr>
  `).join("");
}

function getMonthlyConvenioStats() {
  const rows = {};
  state.faturamentos.forEach((item) => {
    const key = `${item.dataFaturamento.slice(0, 7)}|${item.convenio}`;
    rows[key] = rows[key] || { month: formatMonth(item.dataFaturamento), convenio: item.convenio, faturado: 0, recebido: 0, glosado: 0 };
    rows[key].faturado += getValorOriginal(item);
    rows[key].recebido += getValorRecebido(item);
  });

  state.glosas.forEach((item) => {
    const billing = findBilling(item.guia);
    if (!billing) return;
    const key = `${billing.dataFaturamento.slice(0, 7)}|${billing.convenio}`;
    rows[key] = rows[key] || { month: formatMonth(billing.dataFaturamento), convenio: billing.convenio, faturado: 0, recebido: 0, glosado: 0 };
    rows[key].glosado += item.valor;
  });

  return Object.values(rows).map((item) => ({ ...item, taxa: item.glosado / Math.max(item.faturado, 1) }));
}

function formatMonth(date) {
  const match = monthOptions.find((item) => item.value === date.slice(0, 7));
  return match ? match.label : date.slice(0, 7);
}

function getAlerts() {
  const alerts = state.glosas.filter((item) => daysUntil(item.prazo) <= 5).map((item) => {
    const days = daysUntil(item.prazo);
    return days <= 1 ? `${item.guia}: recurso vence amanha.` : `${item.guia}: recurso vence em ${days} dias.`;
  });
  const worst = getRanking()[0];
  alerts.push(`${worst.convenio} concentra o maior risco: ${percent.format(worst.taxa)} de glosa.`);
  alerts.push("Guias com autorizacao complementar devem ser revisadas antes do envio.");
  return alerts;
}

function getWorkerPerformance() {
  const workers = {};
  state.faturamentos.forEach((item) => {
    workers[item.responsavel] = { name: item.responsavel, errors: 0 };
  });
  state.glosas.forEach((item) => {
    workers[item.responsavel] = workers[item.responsavel] || { name: item.responsavel, errors: 0 };
    workers[item.responsavel].errors += 1;
  });
  return Object.values(workers).sort((a, b) => a.errors - b.errors);
}

function daysUntil(date) {
  const today = new Date("2026-06-12T12:00:00");
  const target = new Date(`${date}T12:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

function drawMonthlyChart() {
  const canvas = byId("monthlyChart");
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = canvas.height;
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, width, height);

  const padding = 34;
  const monthlyStats = getMonthlyStats();
  const max = Math.max(1, ...monthlyStats.flatMap((item) => [item.faturado, item.recebido, item.glosado]));
  const colors = { faturado: "#047d7c", recebido: "#2463eb", glosado: "#c2413b" };
  const keys = Object.keys(colors);
  const groupWidth = (width - padding * 2) / monthlyStats.length;
  const barWidth = Math.max(10, groupWidth / 5);

  ctx.strokeStyle = "#dbe2e6";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  monthlyStats.forEach((month, index) => {
    const x = padding + index * groupWidth + groupWidth / 2;
    keys.forEach((key, keyIndex) => {
      const barHeight = (month[key] / max) * (height - padding * 2);
      ctx.fillStyle = colors[key];
      ctx.fillRect(x + (keyIndex - 1) * (barWidth + 4), height - padding - barHeight, barWidth, barHeight);
    });
    ctx.fillStyle = "#6a7680";
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(month.month, x, height - 10);
  });

  keys.forEach((key, index) => {
    ctx.fillStyle = colors[key];
    ctx.fillRect(padding + index * 120, 8, 12, 12);
    ctx.fillStyle = "#162025";
    ctx.textAlign = "left";
    ctx.fillText(key[0].toUpperCase() + key.slice(1), padding + 18 + index * 120, 18);
  });
}

function getMonthlyStats() {
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const stats = monthNames.map((month) => ({ month, faturado: 0, recebido: 0, glosado: 0 }));
  const billings = getFilteredBillings();
  const allowedGuias = billings.map((item) => item.guia);

  billings.forEach((item) => {
    const monthIndex = new Date(`${item.dataFaturamento}T12:00:00`).getMonth();
    stats[monthIndex].faturado += getValorOriginal(item);
    stats[monthIndex].recebido += getValorRecebido(item);
  });

  getFilteredGlosas(allowedGuias).forEach((item) => {
    const billing = findBilling(item.guia);
    const date = billing?.dataFaturamento || item.data;
    const monthIndex = new Date(`${date}T12:00:00`).getMonth();
    stats[monthIndex].glosado += item.valor;
  });

  const visibleStats = stats.filter((item) => item.faturado > 0 || item.recebido > 0 || item.glosado > 0);
  return visibleStats.length ? visibleStats : [{ month: "Sem dados", faturado: 0, recebido: 0, glosado: 0 }];
}

function analyzeRisk(form) {
  const guia = form.guia.value;
  const billing = findBilling(guia);
  const ranking = getRanking().find((item) => item.convenio === billing?.convenio);
  const checked = ["assinatura", "autorizacao", "pedido", "procedimento", "campos"].filter((name) => form[name].checked);
  let score = Math.round((ranking?.taxa || 0.02) * 100);
  score += checked.length * 13;
  if (form.autorizacao.checked) score += 18;
  if (form.procedimento.checked) score += 16;
  if (billing?.exame.includes("Angiotomografia")) score += 9;
  score = Math.min(97, Math.max(4, score));

  const mainCause = form.autorizacao.checked ? "ausencia de autorizacao complementar" : form.procedimento.checked ? "divergencia entre procedimento e autorizacao" : checked.length ? "pendencias documentais" : "historico do convenio";
  byId("riskMeter").textContent = `${score}%`;
  byId("riskMeter").style.background = `conic-gradient(${score > 70 ? "#c2413b" : score > 38 ? "#b7791f" : "#1c8b52"} ${score * 3.6}deg, #e6ecef 0deg)`;
  byId("riskTitle").textContent = `${guia} possui ${score}% de chance de glosa`;
  byId("riskMessage").textContent = `A guia do convenio ${billing?.convenio || ""} apresenta risco por ${mainCause}. Pacientes deste convenio tem comportamento historico ${ranking && ranking.taxa > 0.08 ? "acima da media" : "controlado"} para este perfil de exame.`;
  byId("riskActions").innerHTML = [
    "Validar autorizacao",
    "Conferir pedido medico",
    "Revisar codigo do procedimento",
    "Anexar laudo e imagens",
  ].map((item) => `<span class="pill">${item}</span>`).join("");
}

function setGlosaEditMode(index) {
  const form = byId("glosaForm");
  const item = state.glosas[index];
  if (!item) return;

  editingGlosaIndex = index;
  hydrateSelects();
  form.editIndex.value = String(index);
  form.guia.value = item.guia;
  form.motivo.value = item.motivo;
  form.valor.value = item.valor;
  form.data.value = item.data;
  form.responsavel.value = item.responsavel;
  form.prazo.value = item.prazo;
  form.statusProcesso.value = item.statusProcesso || "Aberta";
  byId("glosaSubmitButton").textContent = "Salvar alterações";
  byId("glosaEditLabel").textContent = `${item.guia} - ${item.motivo}`;
  byId("glosaEditBanner").classList.add("active");
}

function clearGlosaEditMode() {
  const form = byId("glosaForm");
  editingGlosaIndex = null;
  form.reset();
  form.editIndex.value = "";
  byId("glosaSubmitButton").textContent = "Registrar glosa";
  byId("glosaEditBanner").classList.remove("active");
  hydrateSelects();
}

document.addEventListener("click", (event) => {
  const editGlosaButton = event.target.closest("[data-edit-glosa]");
  if (editGlosaButton) {
    setGlosaEditMode(Number(editGlosaButton.dataset.editGlosa));
    byId("glosaForm").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const target = event.target.closest("[data-target]");
  if (!target) return;
  const view = target.dataset.target;
  document.querySelectorAll(".view").forEach((item) => item.classList.toggle("active", item.id === view));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.target === view));
});

byId("seedDataButton").addEventListener("click", () => {
  state = structuredClone(sampleState);
  clearGlosaEditMode();
  saveState();
  render();
});

byId("dashboardMonth").addEventListener("change", (event) => {
  dashboardFilters.month = event.target.value;
  renderDashboard();
});

byId("dashboardConvenio").addEventListener("change", (event) => {
  dashboardFilters.convenio = event.target.value === "Todos os convênios" ? "all" : event.target.value;
  renderDashboard();
});

byId("backupButton").addEventListener("click", () => {
  const data = {
    sistema: "Metta Faturamento",
    geradoEm: new Date().toISOString(),
    state,
  };
  downloadFile("metta-faturamento-backup.json", JSON.stringify(data, null, 2), "application/json");
});

byId("restoreInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = parsed.state || parsed;
      saveState();
      clearGlosaEditMode();
      render();
      event.target.value = "";
    } catch {
      alert("Nao foi possivel importar o backup. Verifique se o arquivo JSON e valido.");
    }
  };
  reader.readAsText(file);
});

byId("excelButton").addEventListener("click", exportExcelReport);

byId("billingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  state.faturamentos.unshift(guide(data.guia, data.paciente, data.convenio, data.dataExame, data.dataFaturamento, data.exame, Number(data.valorOriginal), Number(data.valorRecebido), data.responsavel, data.status));
  saveState();
  event.currentTarget.reset();
  render();
});

byId("glosaForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const updatedGlosa = glosa(data.guia, data.motivo, Number(data.valor), data.data, data.responsavel, data.prazo, data.statusProcesso);
  if (editingGlosaIndex === null) {
    state.glosas.unshift(updatedGlosa);
  } else {
    state.glosas[editingGlosaIndex] = updatedGlosa;
  }
  const billing = findBilling(data.guia);
  if (billing) billing.status = getBillingStatusFromGlosa(data.statusProcesso);
  saveState();
  clearGlosaEditMode();
  render();
});

byId("cancelGlosaEdit").addEventListener("click", clearGlosaEditMode);

byId("radarForm").addEventListener("submit", (event) => {
  event.preventDefault();
  analyzeRisk(event.currentTarget);
});

window.addEventListener("resize", drawMonthlyChart);
render();

function getBillingStatusFromGlosa(statusProcesso) {
  if (["Em análise", "Recurso enviado"].includes(statusProcesso)) return "Em recurso";
  if (["Deferida", "Recuperada"].includes(statusProcesso)) return "Recuperado";
  return "Glosado";
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportExcelReport() {
  const sheets = [
    tableSheet("Resumo Mensal Convenio", ["Mes", "Convenio", "Faturado", "Recebido", "Glosado", "% Glosa"], getMonthlyConvenioStats().map((item) => [
      item.month,
      item.convenio,
      item.faturado,
      item.recebido,
      item.glosado,
      `${(item.taxa * 100).toFixed(2)}%`,
    ])),
    tableSheet("Guias", ["Guia", "Paciente", "Convenio", "Data Exame", "Data Faturamento", "Exame", "Valor Original", "Valor Recebido", "Diferenca", "Status", "Responsavel"], state.faturamentos.map((item) => [
      item.guia,
      item.paciente,
      item.convenio,
      item.dataExame,
      item.dataFaturamento,
      item.exame,
      getValorOriginal(item),
      getValorRecebido(item),
      getValorOriginal(item) - getValorRecebido(item),
      item.status,
      item.responsavel,
    ])),
    tableSheet("Glosas", ["Guia", "Convenio", "Motivo", "Valor Glosado", "Data Glosa", "Responsavel", "Prazo", "Status Processo"], state.glosas.map((item) => {
      const billing = findBilling(item.guia);
      return [
        item.guia,
        billing?.convenio || "",
        item.motivo,
        item.valor,
        item.data,
        item.responsavel,
        item.prazo,
        item.statusProcesso || "Aberta",
      ];
    })),
    tableSheet("Ranking Convenios", ["Convenio", "Faturado", "Glosado", "% Glosa"], getRanking().map((item) => [
      item.convenio,
      item.faturado,
      item.glosado,
      `${(item.taxa * 100).toFixed(2)}%`,
    ])),
  ];

  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>${sheets.join("<br />")}</body>
    </html>
  `;
  downloadFile("relatorio-metta-faturamento.xls", html, "application/vnd.ms-excel");
}

function tableSheet(title, headers, rows) {
  return `
    <table border="1">
      <caption><strong>${escapeHtml(title)}</strong></caption>
      <thead><tr>${headers.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(String(item ?? ""))}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
