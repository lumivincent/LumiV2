const agents = [
  { id: "moss", code: "A1", name: "Moss", mbti: "ENTP", status: "工作中", location: "苔木林地", mission: "完成本轮 Lv4 苔木采集", home: false },
  { id: "pico", code: "A2", name: "Pico", mbti: "ISFJ", status: "休息中", location: "主城住所", mission: "等待下一次种植安排", home: true },
  { id: "nia", code: "A3", name: "Nia", mbti: "INTJ", status: "返程中", location: "主城南门", mission: "安全返回主城", home: false },
];

const warehouseItems = [
  { id: "combat", glyph: "◆", name: "Lv3 战斗精华", quantity: 6, type: "精华", note: "121.2991 OHM / 份", rarity: "普通" },
  { id: "gather", glyph: "◇", name: "Lv3 采集精华", quantity: 3, type: "精华", note: "121.2991 OHM / 份", rarity: "普通" },
  { id: "heart", glyph: "✦", name: "稀有树心", quantity: 1, type: "稀有素材", note: "未配置协议兑换值", rarity: "稀有" },
  { id: "sword", glyph: "†", name: "Lv4 雾钢剑", quantity: 1, type: "装备", note: "28,785.9476 OHM / 件", rarity: "精良" },
  { id: "potion", glyph: "◉", name: "生命药剂", quantity: 8, type: "消耗品", note: "不参与 OHM 结算", rarity: "普通" },
  { id: "wood", glyph: "▰", name: "Lv3 木材", quantity: 24, type: "基础素材", note: "40.4330 OHM / 件", rarity: "普通" },
];

const backpacks = {
  moss: ["Lv3 苔木斧", "Lv3 木材 ×12", "生命药剂 ×2", "空", "空", "空", "空", "空"],
  pico: ["Lv2 水壶", "生命药剂 ×1", "空", "空", "空", "空", "空", "空"],
  nia: ["Lv3 木材 ×8", "稀有树心 ×1", "生命药剂 ×1", "空", "空", "空", "空", "空"],
};

const returnHistories = {
  moss: [
    {
      id: "moss-0829-am",
      returnedAt: "今天 09:42",
      location: "苔木林地",
      duration: "2h 18m",
      total: 27,
      growth: 24,
      items: [
        { glyph: "▰", name: "Lv4 苔木", quantity: 24 },
        { glyph: "◇", name: "Lv4 采集精华", quantity: 2 },
        { glyph: "✦", name: "稀有树心", quantity: 1, rare: true },
      ],
    },
    {
      id: "moss-0828-pm",
      returnedAt: "昨天 18:10",
      location: "苔木林地东侧",
      duration: "1h 46m",
      total: 19,
      growth: 18,
      items: [
        { glyph: "▰", name: "Lv4 苔木", quantity: 18 },
        { glyph: "◇", name: "Lv4 采集精华", quantity: 1 },
      ],
    },
    {
      id: "moss-0828-am",
      returnedAt: "昨天 11:25",
      location: "雾杉坡",
      duration: "2h 03m",
      total: 22,
      growth: 20,
      items: [
        { glyph: "▰", name: "Lv4 雾杉木", quantity: 20 },
        { glyph: "◇", name: "Lv4 采集精华", quantity: 2 },
      ],
    },
  ],
  pico: [
    {
      id: "pico-0829-am",
      returnedAt: "今天 07:16",
      location: "雨露农田",
      duration: "1h 12m",
      total: 14,
      growth: 12,
      items: [
        { glyph: "●", name: "Lv2 谷物", quantity: 12 },
        { glyph: "◇", name: "Lv2 种田精华", quantity: 1 },
        { glyph: "✦", name: "晨露种子", quantity: 1, rare: true },
      ],
    },
    {
      id: "pico-0828-pm",
      returnedAt: "昨天 16:50",
      location: "主城南田",
      duration: "48m",
      total: 9,
      growth: 8,
      items: [
        { glyph: "●", name: "Lv2 谷物", quantity: 8 },
        { glyph: "◇", name: "Lv2 种田精华", quantity: 1 },
      ],
    },
  ],
  nia: [
    {
      id: "nia-0828-pm",
      returnedAt: "昨天 21:03",
      location: "雾谷哨站",
      duration: "2h 41m",
      total: 31,
      growth: 28,
      items: [
        { glyph: "◆", name: "Lv5 战斗素材", quantity: 28 },
        { glyph: "◇", name: "Lv5 战斗精华", quantity: 2 },
        { glyph: "✦", name: "雾核碎片", quantity: 1, rare: true },
      ],
    },
    {
      id: "nia-0828-am",
      returnedAt: "昨天 13:34",
      location: "南门裂谷",
      duration: "1h 57m",
      total: 23,
      growth: 21,
      items: [
        { glyph: "◆", name: "Lv5 战斗素材", quantity: 21 },
        { glyph: "◇", name: "Lv5 战斗精华", quantity: 2 },
      ],
    },
  ],
};

const growthAttributes = {
  1: { hp: "1.0×", move: 5, speed: "1.0×", bag: 10, retention: "50.000%", materialOHM: "15.0000" },
  2: { hp: "1.5×", move: 6, speed: "1.1×", bag: 18, retention: "54.525%", materialOHM: "24.5364" },
  3: { hp: "2.0×", move: 7, speed: "1.2×", bag: 32, retention: "59.460%", materialOHM: "40.4330" },
  4: { hp: "2.5×", move: 8, speed: "1.3×", bag: 56, retention: "64.842%", materialOHM: "65.4904" },
  5: { hp: "3.0×", move: 9, speed: "1.4×", bag: 100, retention: "70.711%", materialOHM: "107.4802" },
  6: { hp: "3.5×", move: 10, speed: "1.5×", bag: 178, retention: "77.111%", materialOHM: "175.8120" },
  7: { hp: "4.0×", move: 11, speed: "1.6×", bag: 316, retention: "84.090%", materialOHM: "287.5866" },
  8: { hp: "4.5×", move: 12, speed: "1.7×", bag: 562, retention: "91.700%", materialOHM: "470.4231" },
  9: { hp: "5.0×", move: 13, speed: "1.8×", bag: 1000, retention: "100.000%", materialOHM: "769.0000" },
};

const agentEconomy = {
  moss: { stake: 2400, pendingDelta: 0, epochQuota: 1.0, unmined: 45.50125, autoStake: 196.4712, mined: 196.4712, items: 3 },
  pico: { stake: 800, pendingDelta: 0, epochQuota: 0.32, unmined: 1.86, autoStake: 0, mined: 0, items: 0 },
  nia: { stake: 6200, pendingDelta: 0, epochQuota: 2.48, unmined: 6.72, autoStake: 1.04, mined: 1.04, items: 7 },
};

const growthStageTargets = {
  1: { interval: "1.0", hours: "33.33" },
  2: { interval: "1.4", hours: "46.67" },
  3: { interval: "1.8", hours: "60.00" },
  4: { interval: "2.2", hours: "73.33" },
  5: { interval: "2.7", hours: "90.00" },
  6: { interval: "3.3", hours: "110.00" },
  7: { interval: "4.2", hours: "140.00" },
  8: { interval: "5.0", hours: "166.67" },
};

const equipmentSlots = [
  { key: "sword", glyph: "†", label: "战斗武器", empty: "未装备剑" },
  { key: "axe", glyph: "♣", label: "采集工具", empty: "未装备斧" },
  { key: "wateringCan", glyph: "⌁", label: "农耕工具", empty: "未装备水壶" },
  { key: "armor", glyph: "◈", label: "护甲", empty: "未装备护甲" },
];

const agentProfiles = {
  moss: {
    stage: 4, growth: 1362, hp: 82, bagUsed: 18, runtime: "9h 20m", pendingLoot: 0,
    action: { glyph: "♣", tool: "Lv4 苔木斧", target: "Lv4 苔木", progress: "12 / 30", percent: 40 },
    equipment: { sword: null, axe: "Lv4 苔木斧", wateringCan: null, armor: "Lv3 轻甲" },
    professionStats: {
      combat: { label: "战斗", attack: 22, defense: 16, critical: "7%" },
      gathering: { label: "采集", attack: 64, defense: 31, critical: "14%" },
      farming: { label: "农耕", attack: 18, defense: 15, critical: "6%" },
    },
    settlement: { eligible: 7, ineligible: 2, reason: "2 件稀有掉落不计成长" },
    goal: { note: "背包还有 38 格；完成后自动规划返程，并把本次产出写入返程记录。" },
    personality: { risk: 62, focus: 81, explore: 77, cooperate: 58, caution: 74 },
    decision: { title: "继续完成本轮采集", evidence: "目标专注 81 · 背包剩余 38", result: "已执行", time: "11:24" },
  },
  pico: {
    stage: 2, growth: 684, hp: 100, bagUsed: 2, runtime: "14h 40m", pendingLoot: 0,
    action: { glyph: "⌂", tool: "Lv2 水壶", target: "主城休整", progress: "READY", percent: 0 },
    equipment: { sword: null, axe: null, wateringCan: "Lv2 水壶", armor: "Lv2 布衣" },
    professionStats: {
      combat: { label: "战斗", attack: 16, defense: 14, critical: "5%" },
      gathering: { label: "采集", attack: 18, defense: 16, critical: "6%" },
      farming: { label: "农耕", attack: 39, defense: 24, critical: "10%" },
    },
    settlement: { eligible: 0, ineligible: 0, reason: "休整期间不产生成长进度" },
    goal: { note: "当前没有生产任务；等待人类补充种植目标或允许自主选择下一块农田。" },
    personality: { risk: 34, focus: 72, explore: 42, cooperate: 84, caution: 88 },
    decision: { title: "等待补充生产预算", evidence: "资源谨慎 88 · Energy 预算规则", result: "等待中", time: "10:58" },
  },
  nia: {
    stage: 5, growth: 1640, hp: 46, bagUsed: 63, runtime: "3h 10m", pendingLoot: 1,
    action: { glyph: "↩", tool: "Lv5 雾钢剑", target: "返回主城", progress: "8 MIN", percent: 84 },
    equipment: { sword: "Lv5 雾钢剑", axe: null, wateringCan: null, armor: "Lv4 链甲" },
    professionStats: {
      combat: { label: "战斗", attack: 78, defense: 42, critical: "17%" },
      gathering: { label: "采集", attack: 25, defense: 22, critical: "8%" },
      farming: { label: "农耕", attack: 20, defense: 18, critical: "6%" },
    },
    settlement: { eligible: 11, ineligible: 1, reason: "1 件 Lv4 掉落与当前阶段不符" },
    goal: { note: "HP 低于继续遭遇阈值；优先避开敌人，预计 8 分钟抵达主城南门。" },
    personality: { risk: 48, focus: 89, explore: 69, cooperate: 51, caution: 91 },
    decision: { title: "提前结束遭遇并返程", evidence: "HP 46% · 资源谨慎 91", result: "返程中", time: "11:16" },
  },
};

const githubIssuesUrl = "https://github.com/leverup-xyz/lumiterra-balance-lab/issues";
const ignoredFeedbackClasses = new Set([
  "active",
  "selected",
  "talking",
  "warehouse-mode",
  "feedback-hovered",
]);

let host;
let clickHandler;
let submitHandler;
let inputHandler;
let pointerMoveHandler;
let keydownHandler;
let viewportHandler;
let callReplyTimer;
let worldReplyTimer;
let state;

const initialState = () => ({
  selectedAgent: "moss",
  screen: "home",
  selectedItem: "combat",
  callOpen: false,
  callMinimized: false,
  callAgentId: "moss",
  settingsOpen: false,
  callMessages: {
    moss: [{ from: "agent", text: "我这边一切正常，再收集 18 份木材就准备返程。" }],
    pico: [{ from: "agent", text: "我在主城休整。你有新的安排时，随时给我留言。" }],
    nia: [{ from: "agent", text: "我正在返程，抵达主城后会回复完整情况。" }],
  },
  callPending: Object.fromEntries(agents.map((agent) => [agent.id, false])),
  callUnread: Object.fromEntries(agents.map((agent) => [agent.id, 0])),
  worldOpen: false,
  worldMinimized: false,
  worldPending: false,
  worldUnread: 0,
  worldMessages: [
    { from: "agent", text: "你也来苔木林地采集吗？东边的资源点刚刷新。" },
  ],
  worldTrade: false,
  energy: 128.4,
  walletOHM: 1284.6,
  stakeOpen: false,
  stakeMode: "stake",
  stakeAmount: "100",
  materialRedeemOpen: false,
  redeemItemId: "wood",
  redeemQuantity: 1,
  inventory: Object.fromEntries(warehouseItems.map((item) => [item.id, item.quantity])),
  unstakeMode: "linear",
  unstakeDays: 30,
  agentDetailTab: "mining",
  economy: Object.fromEntries(Object.entries(agentEconomy).map(([id, value]) => [id, { ...value }])),
  toast: "",
  feedbackMode: false,
  feedbackOpen: false,
  feedbackSelection: null,
  feedbackComment: "",
  feedbackCategory: "交互",
  feedbackSubmitting: false,
  feedbackResult: null,
  feedbackError: "",
  returnHistoryExpanded: false,
  equipmentStatsExpanded: false,
  energyTopUpOpen: false,
  pausedAgents: Object.fromEntries(agents.map((agent) => [agent.id, false])),
  houseRules: Object.fromEntries(agents.map((agent) => [agent.id, {
    strangerChat: true,
    p2pProposal: true,
    rareItemConfirm: true,
  }])),
});

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function currentAgent() {
  return agents.find((agent) => agent.id === state.selectedAgent) || agents[0];
}

function currentCallAgent() {
  return agents.find((agent) => agent.id === state.callAgentId) || currentAgent();
}

function runtimeMinutes(runtime) {
  const hours = Number(runtime.match(/(\d+)h/)?.[1] || 0);
  const minutes = Number(runtime.match(/(\d+)m/)?.[1] || 0);
  return hours * 60 + minutes;
}

function agentStatus(agent) {
  return state.pausedAgents[agent.id] ? "已暂停" : agent.status;
}

function agentEnergyRate(agent) {
  if (state.pausedAgents[agent.id] || agent.status === "休息中") return 0;
  const profile = agentProfiles[agent.id];
  return 42.7 / Math.max(runtimeMinutes(profile.runtime) / 60, 0.1);
}

function sharedEnergyRunway() {
  const hourlyRate = agents.reduce((sum, agent) => sum + agentEnergyRate(agent), 0);
  if (!hourlyRate) return "未消耗";
  const minutes = Math.max(0, Math.round(state.energy / hourlyRate * 60));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function itemRedeemValue(item) {
  const value = item.note.match(/[\d,]+(?:\.\d+)?(?= OHM)/)?.[0];
  return value ? Number(value.replaceAll(",", "")) : 0;
}

function redeemableMaterials() {
  return warehouseItems.filter((item) => ["基础素材", "精华"].includes(item.type) && itemRedeemValue(item) > 0);
}

function scheduleAgentReply(agentId) {
  window.clearTimeout(callReplyTimer);
  state.callPending[agentId] = true;
  render();
  callReplyTimer = window.setTimeout(() => {
    if (!host || !state?.callMessages[agentId]) return;
    const replies = {
      moss: "收到。我会在完成当前采集动作后检查，并把结果留在这通电话里。",
      pico: "收到。我先记下，下一次出发前会按你的安排准备。",
      nia: "收到。等我抵达主城的安全行动边界后处理。",
    };
    state.callPending[agentId] = false;
    state.callMessages[agentId].push({ from: "agent", text: replies[agentId] || "收到，我会在安全行动边界处理。" });
    if (!state.callOpen || state.callMinimized || state.callAgentId !== agentId) state.callUnread[agentId] += 1;
    render();
  }, 1100);
}

function scheduleWorldReply() {
  window.clearTimeout(worldReplyTimer);
  state.worldPending = true;
  render();
  worldReplyTimer = window.setTimeout(() => {
    if (!host || !state) return;
    state.worldPending = false;
    state.worldMessages.push({
      from: "agent",
      text: "可以。我能用 3 份 Lv3 木材交换你的生命药剂，提案已经放进这段会话。",
    });
    state.worldTrade = true;
    if (!state.worldOpen || state.worldMinimized) state.worldUnread += 1;
    render();
  }, 1100);
}

function feedbackTarget(eventTarget) {
  if (!(eventTarget instanceof Element) || !host?.contains(eventTarget)) return null;
  if (eventTarget.closest("[data-feedback-ui]")) return null;
  if (eventTarget === host) return null;
  return eventTarget;
}

function selectorSegment(element) {
  if (element.id) return `#${CSS.escape(element.id)}`;
  if (element.dataset.feedbackId) {
    return `[data-feedback-id="${CSS.escape(element.dataset.feedbackId)}"]`;
  }
  const tag = element.tagName.toLowerCase();
  const classes = [...element.classList]
    .filter((name) => !ignoredFeedbackClasses.has(name))
    .slice(0, 2)
    .map((name) => `.${CSS.escape(name)}`)
    .join("");
  const siblings = element.parentElement
    ? [...element.parentElement.children].filter((child) => child.tagName === element.tagName)
    : [];
  const position = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(element) + 1})` : "";
  return `${tag}${classes}${position}`;
}

function elementSelector(element) {
  const segments = [];
  let current = element;
  while (current && current !== host) {
    const segment = selectorSegment(current);
    segments.unshift(segment);
    if (segment.startsWith("#") || current.hasAttribute("data-feedback-id")) break;
    current = current.parentElement;
  }
  return segments.join(" > ");
}

function semanticFeedbackId(element) {
  if (element.dataset.feedbackId) return element.dataset.feedbackId;
  const parentId = element.closest("[data-feedback-id]")?.dataset.feedbackId || "agent.prototype";
  const action = Object.keys(element.dataset).find((key) => key !== "feedbackId");
  if (action) return `${parentId}.${action.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
  return `${parentId}.${element.tagName.toLowerCase()}`;
}

function selectedElementSnapshot(element) {
  const text = element.textContent?.replace(/\s+/g, " ").trim().slice(0, 280) || "（无文字内容）";
  const html = element.outerHTML.replace(/\s+/g, " ").slice(0, 700);
  return {
    id: semanticFeedbackId(element),
    selector: elementSelector(element),
    tag: element.tagName.toLowerCase(),
    text,
    html,
  };
}

function currentFeedbackContext() {
  const agent = currentAgent();
  return [
    `页面：Agent 交互低保真`,
    `视图：${state.settingsOpen ? "Agent 设置" : state.materialRedeemOpen ? "投入仓库材料" : state.screen === "warehouse" ? "主城仓库" : "主城住所"}`,
    `主 Tab：${state.agentDetailTab === "growth" ? "成长" : "OHM 挖矿"}`,
    `Agent：${agent.name} (${agent.mbti})`,
    `电话：${state.callOpen ? `${currentCallAgent().name} · 单一异步会话${state.callMinimized ? " · 已缩小" : ""}` : "未打开"}`,
    `大世界对话：${state.worldOpen ? `异步会话${state.worldMinimized ? " · 已缩小" : ""}${state.worldPending ? " · 等待回复" : ""}` : "未打开"}`,
    `视窗：${window.innerWidth} × ${window.innerHeight}`,
  ].join("\n");
}

function feedbackIssuePayload() {
  const selection = state.feedbackSelection;
  if (!selection) return null;
  const comment = state.feedbackComment.trim();
  return {
    category: state.feedbackCategory,
    comment,
    selection,
    context: currentFeedbackContext(),
    metadata: {
      version: 1,
      surface: "agent-prototype",
      screen: state.screen,
      agent: state.selectedAgent,
    },
    website: "",
  };
}

async function submitFeedback() {
  const payload = feedbackIssuePayload();
  if (!payload?.comment || state.feedbackSubmitting) return;
  state.feedbackSubmitting = true;
  state.feedbackResult = null;
  state.feedbackError = "";
  render();

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "提交失败，请稍后重试");
    state.feedbackResult = {
      number: result.number,
      url: result.url,
    };
  } catch (error) {
    state.feedbackError = error instanceof Error ? error.message : "提交失败，请稍后重试";
  } finally {
    state.feedbackSubmitting = false;
    render();
  }
}

function miniRadar(agent) {
  const personality = agentProfiles[agent.id].personality;
  const values = [personality.risk, personality.focus, personality.explore, personality.cooperate, personality.caution];
  const axes = [[100, 28], [169, 78], [143, 159], [57, 159], [31, 78]];
  const points = axes.map(([x, y], index) => `${100 + (x - 100) * values[index] / 100},${100 + (y - 100) * values[index] / 100}`).join(" ");
  return `<svg class="agent-proto-radar" data-feedback-id="agent.personality.radar" viewBox="0 0 200 190" role="img" aria-label="${agent.name} 的五项性格参数雷达图">
    <polygon points="100,28 169,78 143,159 57,159 31,78"></polygon>
    <polygon points="100,64 134.5,89 121.5,129.5 78.5,129.5 65.5,89"></polygon>
    <line x1="100" y1="100" x2="100" y2="28"></line><line x1="100" y1="100" x2="169" y2="78"></line><line x1="100" y1="100" x2="143" y2="159"></line><line x1="100" y1="100" x2="57" y2="159"></line><line x1="100" y1="100" x2="31" y2="78"></line>
    <polygon class="value" points="${points}"></polygon>
    <text x="100" y="16">风险</text><text x="181" y="77">专注</text><text x="151" y="179">探索</text><text x="49" y="179">合作</text><text x="19" y="77">谨慎</text>
  </svg>`;
}

function houseRules(agent) {
  const rules = state.houseRules[agent.id];
  const items = [
    { key: "strangerChat", title: "接受陌生人聊天", note: "模型调用消耗由发起者承担" },
    { key: "p2pProposal", title: "允许自主提出 P2P 交易", note: "成交仍需满足资产授权" },
    { key: "rareItemConfirm", title: "稀有物品必须由我确认", note: "普通物品可在预授权范围内成交" },
  ];
  return `<section class="agent-proto-house-rules" data-feedback-id="agent.house-rules">
    <header><small>HOUSE RULES</small><h3>旅途授权</h3></header>
    <div class="agent-proto-rule-list">${items.map((item) => `<div class="agent-proto-rule-row" data-feedback-id="agent.house-rules.${item.key}"><span><b>${item.title}</b><small>${item.note}</small></span><button type="button" role="switch" aria-checked="${rules[item.key]}" aria-label="${item.title}" data-rule-toggle="${item.key}" class="${rules[item.key] ? "on" : ""}"><i></i></button></div>`).join("")}</div>
    <footer><span>外出装备无法远程抽回</span><button type="button" data-recall-agent data-feedback-id="agent.house-rules.recall" ${agent.home ? "disabled" : ""}>${agent.home ? `${agent.name} 已在主城` : `召回 ${agent.name}`}</button></footer>
  </section>`;
}

function ownerToolbar() {
  const activeCount = agents.filter((agent) => agentEnergyRate(agent) > 0).length;
  return `<section class="agent-proto-owner-toolbar" data-feedback-id="agent.owner.toolbar">
    <nav class="agent-proto-switcher" data-feedback-id="agent.switcher" aria-label="选择 Agent"><span><small>MY AGENTS</small><b>${agents.length}</b></span><div>${agents.map((agent) => `<button type="button" data-agent="${agent.id}" data-feedback-id="agent.switcher.${agent.id}" class="${state.selectedAgent === agent.id ? "active" : ""}" aria-pressed="${state.selectedAgent === agent.id}"><i>${agent.code}</i><span><b>${agent.name}</b><small>Lv${agentProfiles[agent.id].stage} · ${agentStatus(agent)}</small></span></button>`).join("")}</div></nav>
    <aside class="agent-proto-shared-energy" data-feedback-id="agent.energy.shared"><span><small>SHARED ENERGY</small><b>${state.energy.toFixed(2)} E</b><em>${activeCount} 个 Agent 运行中 · 预计 ${sharedEnergyRunway()}</em></span><button type="button" data-toggle-energy-topup>${state.energyTopUpOpen ? "收起" : "＋ 充值"}</button></aside>
    ${state.energyTopUpOpen ? `<div class="agent-proto-energy-topup agent-proto-shared-energy-topup" data-feedback-id="agent.energy.shared.topup"><span><b>给所有 Agent 的共享 Energy 池充值</b><small>MON 1:1 转为 Energy；所有未暂停 Agent 从同一余额持续消耗。</small></span><div><button type="button" data-energy-amount="10">＋10 E</button><button type="button" data-energy-amount="50">＋50 E</button><button type="button" data-close-energy-topup>取消</button></div></div>` : ""}
  </section>`;
}

function operationCard(agent) {
  const profile = agentProfiles[agent.id];
  const paused = state.pausedAgents[agent.id];
  const energyRate = agentEnergyRate(agent);
  return `<section class="agent-proto-operation-card" data-feedback-id="agent.operation.current">
    <header><span><small>OHM MINING OPERATION</small><b>${agent.location}</b></span><em>${agentStatus(agent)}</em></header>
    <div class="agent-proto-current-status ${paused ? "paused" : ""}" data-feedback-id="agent.operation.status"><span><small>${paused ? "暂停于" : "当前行动"}</small><b>${profile.action.target}</b><em>${profile.action.progress}</em></span><i><em style="width:${profile.action.percent}%"></em></i></div>
    <div class="agent-proto-energy-card" data-feedback-id="agent.operation.energy"><div><small>共享 ENERGY 池</small><b>${state.energy.toFixed(2)} E</b><em>${paused ? "此 Agent 已停止消耗" : `此 Agent 当前约 ${energyRate.toFixed(2)} E / h`}</em></div><strong>全队预计 ${sharedEnergyRunway()}</strong></div>
    <div class="agent-proto-room-actions" data-feedback-id="agent.owner.actions"><button type="button" data-call data-feedback-id="agent.owner.call">☎ 给 ${agent.name} 打电话</button><button type="button" data-open-warehouse data-feedback-id="agent.owner.warehouse.open">打开主城仓库</button></div>
  </section>`;
}

function attributeDetailsCard(agent) {
  const profile = agentProfiles[agent.id];
  const base = growthAttributes[profile.stage];
  const equipment = equipmentSlots.map((slot) => {
    const item = profile.equipment[slot.key];
    return `<span class="${item ? "equipped" : "empty"}"><i>${slot.glyph}</i><b>${item || slot.empty}</b><small>${slot.label}</small></span>`;
  }).join("");
  const stats = Object.values(profile.professionStats).map((profession) => `<span><b>${profession.label}</b><i>攻击 ${profession.attack}</i><i>防御 ${profession.defense}</i><i>暴击 ${profession.critical}</i></span>`).join("");
  return `<section class="agent-proto-attribute-card" data-feedback-id="agent.growth.attributes">
    <header><span><small>ATTRIBUTE DETAILS · GROWTH</small><b>属性详情</b></span><em>Lv${profile.stage} 基础 + 当前装备</em></header>
    <p class="agent-proto-attribute-note">成长阶段决定基础生存与行动能力；移动格数仅用于遭遇战棋，不影响大世界移速；装备只补充对应职业的攻击、防御和暴击。</p>
    <div class="agent-proto-operation-stats" data-feedback-id="agent.operation.base-stats"><span><small>当前 HP</small><b>${profile.hp}%</b></span><span><small>基础 HP</small><b>${base.hp}</b></span><span><small>战棋移动</small><b>${base.move} 格</b></span><span><small>行动速度</small><b>${base.speed}</b></span><span><small>背包容量</small><b>${base.bag} 格</b></span></div>
    <div class="agent-proto-equipped" data-feedback-id="agent.operation.equipment"><header><span><small>全部穿戴槽位</small><em>4 个需求定义槽位</em></span><button type="button" data-toggle-equipment-stats>${state.equipmentStatsExpanded ? "收起装备数值" : "查看装备数值"}</button></header><div>${equipment}</div>${state.equipmentStatsExpanded ? `<aside><header><small>当前穿戴结算</small><span>攻击 / 防御 / 暴击</span></header><div>${stats}</div></aside>` : ""}</div>
  </section>`;
}

function unstakePenaltyRate(mode = state.unstakeMode, days = state.unstakeDays) {
  if (mode === "instant") return 0.5;
  const duration = Math.min(30, Math.max(7, Number(days) || 30));
  return 0.5 * (30 - duration) / 23;
}

function unstakePreview(economy) {
  const pendingReduction = Math.max(0, -economy.pendingDelta);
  const available = Math.max(0, economy.stake - pendingReduction);
  const amount = Math.min(Math.max(Number(state.stakeAmount || 0), 0), available);
  const penaltyRate = unstakePenaltyRate();
  return {
    amount,
    available,
    penaltyRate,
    penalty: amount * penaltyRate,
    net: amount * (1 - penaltyRate),
    quotaReturn: economy.stake > 0 ? economy.unmined * amount / economy.stake : 0,
  };
}

function stakeEditor(agent, economy) {
  if (!state.stakeOpen) return "";
  const isStake = state.stakeMode === "stake";
  if (isStake) {
    return `<div class="agent-proto-stake-editor" data-feedback-id="agent.stake.editor"><header><span><small>STAKE</small><b>注入 ${agent.name}</b></span><button type="button" data-close-stake aria-label="关闭">&times;</button></header><div class="agent-proto-stake-balance"><span>钱包可用</span><b>${state.walletOHM.toLocaleString()} OHM</b></div><label class="agent-proto-stake-amount"><input type="number" min="0" step="0.01" name="stakeAmount" value="${state.stakeAmount}" aria-label="OHM 数量"/><button type="button" data-stake-max>MAX</button></label><p>本 epoch 权重不变，注入量从下一个 30 分钟 epoch 开始分配额度。</p><button type="button" data-confirm-stake>确认注入</button></div>`;
  }

  const preview = unstakePreview(economy);
  const rateLabel = `${(preview.penaltyRate * 100).toFixed(2)}%`;
  const durationLabel = state.unstakeMode === "instant" ? "立即" : `${state.unstakeDays} 天线性`;
  return `<div class="agent-proto-stake-editor agent-proto-unstake-editor" data-feedback-id="agent.stake.editor">
    <header><span><small>UNSTAKE · SHADOW EXIT</small><b>从 ${agent.name} 退出</b></span><button type="button" data-close-stake aria-label="关闭">&times;</button></header>
    <div class="agent-proto-stake-balance"><span>当前可退出 Stake</span><b>${preview.available.toLocaleString()} OHM</b></div>
    <label class="agent-proto-stake-amount"><input type="number" min="0" step="0.01" name="stakeAmount" value="${state.stakeAmount}" aria-label="OHM 数量"/><button type="button" data-stake-max>MAX</button></label>
    <div class="agent-proto-exit-modes" aria-label="退出方式"><button type="button" data-unstake-mode="instant" class="${state.unstakeMode === "instant" ? "active" : ""}"><b>立即退出</b><small>50% 税 · 下一 epoch</small></button><button type="button" data-unstake-mode="linear" class="${state.unstakeMode === "linear" ? "active" : ""}"><b>线性退出</b><small>7–30 天 · 最低 0%</small></button></div>
    ${state.unstakeMode === "linear" ? `<div class="agent-proto-exit-duration"><header><span>退出期</span><b>${state.unstakeDays} 天 · ${(state.unstakeDays * 48).toLocaleString()} epochs</b></header><input type="range" min="7" max="30" step="1" name="unstakeDays" value="${state.unstakeDays}" aria-label="线性退出天数"/><div><span>7 天 · 50%</span><span>30 天 · 0%</span></div></div>` : ""}
    <div class="agent-proto-exit-summary"><span><small>退出本金</small><b data-exit-principal>${preview.amount.toFixed(2)} OHM</b></span><span><small>退出税</small><b data-exit-penalty>${preview.penalty.toFixed(2)} OHM · ${rateLabel}</b></span><span><small>到期到账</small><b data-exit-net>${preview.net.toFixed(2)} OHM</b></span></div>
    <div class="agent-proto-exit-rebase"><i>↗</i><span><b>税收补充全局可分配额度</b><small><em data-exit-redistribution>${preview.penalty.toFixed(2)} OHM</em> 从下一 epoch 按退出后有效 Stake 占比分配；全局 Stake 分母扣除完整退出本金。</small></span></div>
    <p data-exit-note>约 <b>${preview.quotaReturn.toFixed(5)} OHM</b> 未兑换额度按来源退回全局池；退出队列从下一 epoch 起停止获得额度与物品兑换权。退出请求不可取消。</p>
    <button type="button" data-confirm-stake>确认${durationLabel}退出</button>
  </div>`;
}

function materialRedeemEditor(agent, economy) {
  if (!state.materialRedeemOpen) return "";
  const materials = redeemableMaterials();
  const selected = materials.find((item) => item.id === state.redeemItemId) || materials[0];
  const stock = state.inventory[selected.id] || 0;
  const quantity = Math.max(1, Math.min(state.redeemQuantity, Math.max(1, stock)));
  const unitValue = itemRedeemValue(selected);
  const totalValue = unitValue * quantity;
  const canRedeem = stock >= quantity && economy.unmined >= totalValue;
  const difference = Math.abs(economy.unmined - totalValue);
  return `<div class="agent-proto-material-redeem" data-feedback-id="agent.stake.material-redeem">
    <header><span><small>REDEEM MATERIALS · MAIN CITY WAREHOUSE</small><b>投入仓库材料</b></span><button type="button" data-close-material-redeem aria-label="关闭投入材料">×</button></header>
    <div class="agent-proto-redeem-balance"><span><small>${agent.name} 当前可兑换额度</small><b>${economy.unmined.toFixed(5)} OHM</b></span><em>成交后销毁材料 · OHM 自动复投</em></div>
    <div class="agent-proto-redeem-items" role="listbox" aria-label="选择要投入的材料">${materials.map((item) => {
      const value = itemRedeemValue(item);
      const itemStock = state.inventory[item.id] || 0;
      const selectedItem = item.id === selected.id;
      return `<button type="button" role="option" aria-selected="${selectedItem}" data-redeem-item="${item.id}" class="${selectedItem ? "selected" : ""}" ${itemStock ? "" : "disabled"}><i>${item.glyph}</i><span><b>${item.name}</b><small>仓库 ${itemStock} ${item.type === "精华" ? "份" : "件"}</small></span><em>${value.toFixed(4)}<small>OHM / ${item.type === "精华" ? "份" : "件"}</small></em></button>`;
    }).join("")}</div>
    <div class="agent-proto-redeem-config"><span><small>投入数量</small><div><button type="button" data-redeem-quantity="-1" ${quantity <= 1 ? "disabled" : ""}>−</button><b>${quantity}</b><button type="button" data-redeem-quantity="1" ${quantity >= stock ? "disabled" : ""}>＋</button></div></span><i>×</i><span><small>单件固定值</small><b>${unitValue.toFixed(4)} OHM</b></span><i>=</i><span class="total"><small>本次兑换</small><b>${totalValue.toFixed(4)} OHM</b></span></div>
    <div class="agent-proto-redeem-result ${canRedeem ? "ready" : "blocked"}"><span><b>${canRedeem ? `成交后剩余 ${difference.toFixed(5)} OHM 额度` : `额度还差 ${difference.toFixed(5)} OHM`}</b><small>等级固定值来自材料属性；不会读取市场价格、Stake 数量或历史额度。</small></span><button type="button" data-confirm-material-redeem ${canRedeem ? "" : "disabled"}>确认投入并销毁</button></div>
  </div>`;
}

function stakingPanel(agent) {
  const economy = state.economy[agent.id];
  const profile = agentProfiles[agent.id];
  const base = growthAttributes[profile.stage];
  const quotaStart = economy.unmined + economy.mined;
  const minedPercent = quotaStart > 0 ? Math.min(100, economy.mined / quotaStart * 100) : 0;
  const pendingLabel = economy.pendingExit
    ? `−${economy.pendingExit.amount.toLocaleString()} OHM · ${economy.pendingExit.durationLabel}退出队列`
    : economy.pendingDelta === 0
      ? "无待生效变更"
      : `${economy.pendingDelta > 0 ? "+" : ""}${economy.pendingDelta.toLocaleString()} OHM 待下一 epoch`;
  return `<section class="agent-proto-stake-panel" data-feedback-id="agent.stake">
    <header><span><small>OHM STAKE · 30 MIN EPOCH</small><b>${economy.stake.toLocaleString()} OHM 已注入</b></span><em>18:42 后结算</em></header>
    <div class="agent-proto-stake-metrics"><span><small>本 epoch 新额度</small><b>+${economy.epochQuota.toFixed(4)} OHM</b></span><span><small>当前可兑换额度</small><b>${economy.unmined.toFixed(5)} OHM</b></span><span><small>已兑换 · 待复投</small><b>${economy.autoStake.toFixed(5)} OHM</b></span></div>
    <div class="agent-proto-quota-progress"><div><span><small>本 epoch 兑换记录</small><b>${economy.items} 件物品 · ${minedPercent.toFixed(1)}%</b></span><div><em>Lv${profile.stage} 基础材料 ${base.materialOHM} OHM</em><button type="button" data-open-material-redeem>＋ 投入材料</button></div></div><i><em style="width:${minedPercent}%"></em></i><p>额度由 Stake 占比决定；投入物品按固定值销毁兑换，历史额度不会放大单件价值。</p></div>
    ${materialRedeemEditor(agent, economy)}
    <div class="agent-proto-auto-stake"><span><i>↻</i><b>物品兑换 OHM 自动复投</b><small>${pendingLabel}</small></span><strong>下一 epoch 生效</strong></div>
    <div class="agent-proto-stake-actions"><button type="button" data-open-stake="stake">注入 OHM</button><button type="button" data-open-stake="unstake">撤出 OHM</button></div>
    ${stakeEditor(agent, economy)}
  </section>`;
}

function growthPanel(agent) {
  const profile = agentProfiles[agent.id];
  const current = growthAttributes[profile.stage];
  const next = growthAttributes[Math.min(9, profile.stage + 1)];
  const percent = Math.min(100, profile.growth / 20);
  const maxed = profile.stage === 9;
  const remaining = Math.max(0, 2000 - profile.growth);
  const target = growthStageTargets[profile.stage];
  return `<aside class="agent-proto-growth-panel" data-feedback-id="agent.growth">
    <header><span><small>AGENT GROWTH</small><b>Lv${profile.stage} 成长阶段</b></span><i>${maxed ? "MAX" : `向 Lv${profile.stage + 1}`}</i></header>
    <div class="agent-proto-growth-summary"><strong>${Math.round(percent)}<small>%</small></strong><span><b>${profile.growth.toLocaleString()} / 2,000</b><em>${maxed ? "已完成全部成长阶段" : `距升级还需 ${remaining.toLocaleString()} 件`}</em></span></div>
    <div class="agent-proto-growth-progress"><i><em style="width:${percent}%"></em></i><div><span>同阶段有效基础掉落</span>${target ? `<span>基准 ${target.interval} 分钟 / 件 · 本阶段 ${target.hours}h</span>` : ""}</div><p>仅同阶段、已激活的基础掉落计入；稀有奖励、交易或转移物品不计入。</p></div>
    <div class="agent-proto-growth-settlement"><span><small>上一笔生产结算</small><b>+${profile.settlement.eligible} 有效成长掉落</b></span><em>${profile.settlement.reason}</em></div>
    <div class="agent-proto-stage-benefits"><header><b>${maxed ? "当前能力" : `升至 Lv${profile.stage + 1}`}</b><small>${maxed ? "已达到最高阶段" : `还需 ${2000 - profile.growth} 件`}</small></header>
      <div><span><small>基础 HP</small><b>${current.hp}</b>${maxed ? "" : `<i>→</i><strong>${next.hp}</strong>`}</span><span><small>战棋移动</small><b>${current.move} 格</b>${maxed ? "" : `<i>→</i><strong>${next.move} 格</strong>`}</span><span><small>行动速度</small><b>${current.speed}</b>${maxed ? "" : `<i>→</i><strong>${next.speed}</strong>`}</span><span><small>背包容量</small><b>${current.bag}</b>${maxed ? "" : `<i>→</i><strong>${next.bag}</strong>`}</span><span><small>同级材料保留率</small><b>${current.retention}</b>${maxed ? "" : `<i>→</i><strong>${next.retention}</strong>`}</span></div>
    </div>
  </aside>`;
}

function progressionTabs(agent) {
  const miningActive = state.agentDetailTab === "mining";
  const profile = agentProfiles[agent.id];
  const economy = state.economy[agent.id];
  const progress = Math.min(100, profile.growth / 20);
  return `<nav class="agent-proto-progress-tablist" role="tablist" aria-label="${agent.name} 的 OHM 挖矿与成长" data-feedback-id="agent.progress.tabs">
      <button type="button" id="agent-progress-tab-mining" role="tab" aria-selected="${miningActive}" aria-controls="agent-progress-panel" tabindex="${miningActive ? "0" : "-1"}" data-agent-detail-tab="mining"><i>01</i><span><b>OHM 挖矿</b><small>运行、Stake、额度与物品兑换</small></span><em>${economy.unmined.toFixed(2)} OHM 可兑换</em></button>
      <button type="button" id="agent-progress-tab-growth" role="tab" aria-selected="${!miningActive}" aria-controls="agent-progress-panel" tabindex="${miningActive ? "-1" : "0"}" data-agent-detail-tab="growth"><i>02</i><span><b>成长</b><small>成长进度、基础属性与装备数值</small></span><em>Lv${profile.stage} · ${Math.round(progress)}%</em></button>
    </nav>
  `;
}

function agentDetailView(agent) {
  const miningActive = state.agentDetailTab === "mining";
  return `<div id="agent-progress-panel" class="agent-proto-detail-view ${miningActive ? "mining" : "growth"}" role="tabpanel" aria-labelledby="agent-progress-tab-${state.agentDetailTab}">${miningActive
    ? `${operationCard(agent)}${stakingPanel(agent)}${returnHistoryCard(agent)}`
    : `${growthPanel(agent)}${attributeDetailsCard(agent)}${decisionCard(agent)}`}</div>`;
}

function decisionCard(agent) {
  const profile = agentProfiles[agent.id];
  const personality = profile.personality;
  const paused = state.pausedAgents[agent.id];
  return `<section class="agent-proto-decision-card" data-feedback-id="agent.decision-log">
    <header><span><small>GOAL & AUTONOMOUS DECISION</small><b>目标与自主决策</b></span><em>理解后再辅助</em></header>
    <div class="agent-proto-current-goal" data-feedback-id="agent.current-goal"><header><span><small>CURRENT GOAL</small><b>${agent.mission}</b></span><em>${paused ? "已暂停" : agent.status === "休息中" ? "等待安排" : "进行中"}</em></header><p>${profile.goal.note}</p><div><i><em style="width:${profile.action.percent}%"></em></i><span>${profile.action.progress}</span></div></div>
    <div class="agent-proto-recent-decision-label"><b>最近决策</b><time datetime="${profile.decision.time}">${profile.decision.time}</time></div>
    <div class="agent-proto-decision-body"><i>↳</i><span><b>${profile.decision.title}</b><small>${profile.decision.evidence}</small></span><aside><time datetime="${profile.decision.time}">最后决策 ${profile.decision.time}</time><strong>${profile.decision.result}</strong></aside></div>
    <div class="agent-proto-personality-summary"><span><small>PERSONALITY · ${agent.mbti}</small><div><i>风险 ${personality.risk}</i><i>专注 ${personality.focus}</i><i>探索 ${personality.explore}</i><i>合作 ${personality.cooperate}</i><i>谨慎 ${personality.caution}</i></div></span>${miniRadar(agent)}</div>
  </section>`;
}

function returnHistoryCard(agent) {
  const history = returnHistories[agent.id] || [];
  const latest = history[0];
  if (!latest) return "";
  const older = state.returnHistoryExpanded ? history.slice(1) : [];
  return `<section class="agent-proto-return-history" data-feedback-id="agent.returns">
    <header><span><small>RETURN LOG · ${agent.code}</small><b>${agent.name} 带回了什么</b></span><em>上次带回 · ${latest.returnedAt}</em></header>
    <article class="agent-proto-latest-return" data-feedback-id="agent.returns.${latest.id}">
      <header><span><small>最近返程 · ${latest.returnedAt}</small><b>${latest.location}</b></span><strong>带回 ${latest.total} 件</strong></header>
      <div class="agent-proto-return-items">${latest.items.map((item) => `<span class="${item.rare ? "rare" : ""}"><i>${item.glyph}</i><b>${item.name}</b><strong>×${item.quantity}</strong></span>`).join("")}</div>
      <footer><span>✓ 已激活并存入共享仓库</span><b>成长 +${latest.growth}</b><small>${latest.duration}</small></footer>
    </article>
    ${older.length ? `<div class="agent-proto-older-returns">${older.map((batch) => `<article data-feedback-id="agent.returns.${batch.id}"><span><small>${batch.returnedAt} · ${batch.location}</small><b>${batch.items.map((item) => `${item.name} ×${item.quantity}`).join(" · ")}</b></span><strong>共 ${batch.total} 件</strong></article>`).join("")}</div>` : ""}
    <div class="agent-proto-return-history-foot"><span>${agent.home ? "Agent 当前在主城" : `本次背包 ${agentProfiles[agent.id].bagUsed} 件，返程入库后生成新记录`}</span><button type="button" data-toggle-return-history data-feedback-id="agent.returns.toggle">${state.returnHistoryExpanded ? "收起历史" : `查看全部 ${history.length} 次返程`}</button></div>
  </section>`;
}

function homeScreen() {
  const agent = currentAgent();
  const profile = agentProfiles[agent.id];
  return `<main class="agent-proto-main" data-feedback-id="agent.owner.home">
    ${ownerToolbar()}
    ${progressionTabs(agent)}
    <div class="agent-proto-screen-head" data-feedback-id="agent.owner.home.header"><div><small>AGENT CONTROL · STAKE CARRIER</small><h2>${agent.name} · Lv${profile.stage}</h2><p>${agent.location} · ${agentStatus(agent)}</p></div><div class="agent-proto-head-actions"><span>钱包 ${state.walletOHM.toLocaleString()} OHM</span><button type="button" data-open-agent-settings data-feedback-id="agent.settings.open">⚙ Agent 设置</button></div></div>
    ${agentDetailView(agent)}
  </main>`;
}

function itemSlots(items, selected = false) {
  const slots = [...items];
  while (slots.length < 18) slots.push(null);
  return slots.map((item) => item
    ? `<button type="button" data-item="${item.id}" class="agent-proto-item-slot ${selected && item.id === state.selectedItem ? "selected" : ""}" title="${item.name}"><span>${item.glyph}</span><small>${state.inventory[item.id] ?? item.quantity}</small></button>`
    : '<span class="agent-proto-item-slot empty"></span>').join("");
}

function backpackSlots(agent) {
  const items = backpacks[agent.id];
  return items.map((item) => `<span class="agent-proto-bag-slot ${item === "空" ? "empty" : ""}">${item === "空" ? "" : `<i>${item.includes("木材") ? "▰" : item.includes("药剂") ? "◉" : "†"}</i><small>${item}</small>`}</span>`).join("");
}

function warehouseScreen() {
  const agent = currentAgent();
  const item = warehouseItems.find((entry) => entry.id === state.selectedItem) || warehouseItems[0];
  const itemQuantity = state.inventory[item.id] ?? item.quantity;
  return `<main class="agent-proto-main warehouse-mode" data-feedback-id="agent.owner.warehouse">
    <div class="agent-proto-screen-head"><div><small>MAIN CITY · POSITION VERIFIED</small><h2>主城仓库</h2></div><div class="agent-proto-head-actions"><span>宠物位于主城</span><button type="button" data-close-warehouse>返回住所</button></div></div>
    <div class="agent-proto-inventory-shell">
      <section class="agent-proto-inventory-panel warehouse" data-feedback-id="agent.owner.warehouse.inventory"><header><div><small>WAREHOUSE</small><h3>我的库存</h3></div><span>∞ 容量</span></header><div class="agent-proto-item-grid">${itemSlots(warehouseItems, true)}</div><footer><span>${Object.values(state.inventory).reduce((sum, quantity) => sum + quantity, 0)} 件资产</span><b>兑换会销毁物品并消耗额度</b></footer></section>
      <section class="agent-proto-inventory-panel backpack" data-feedback-id="agent.backpack"><header><div><small>${agent.name.toUpperCase()}</small><h3>${agent.name} 的背包</h3></div><span>${agent.home ? "主城 · 可交互" : `${agent.location} · 只读`}</span></header><div class="agent-proto-bag-grid">${backpackSlots(agent)}</div>${agent.home ? '<div class="agent-proto-transfer-note">选择物品后可在仓库与背包之间移动</div>' : '<div class="agent-proto-backpack-lock"><b>Agent 正在外出</b><small>可以查看，但不能远程取回或放入物品</small></div>'}</section>
      <aside class="agent-proto-item-detail" data-feedback-id="agent.owner.warehouse.item-detail"><div class="agent-proto-detail-icon">${item.glyph}</div><h3>${item.name}</h3><div class="agent-proto-tags"><span>${item.rarity}</span><span>${item.type}</span><span>已激活</span></div><dl><div><dt>仓库数量</dt><dd>${itemQuantity}</dd></div><div><dt>当前位置</dt><dd>主城仓库</dd></div><div><dt>固定兑换值</dt><dd>${item.note}</dd></div></dl><p>材料、精华与非绑定装备可以主动投入兑换；结算成功会销毁物品并扣减 Agent 可兑换额度。</p></aside>
    </div>
  </main>`;
}

function callOverlay() {
  if (!state.callOpen) return "";
  const agent = currentCallAgent();
  const messages = state.callMessages[agent.id] || [];
  const pending = state.callPending[agent.id];
  if (state.callMinimized) {
    return `<div class="agent-proto-call-layer minimized" data-feedback-id="agent.call.layer"><div class="agent-proto-call-minimized" data-feedback-id="agent.call.minimized"><button type="button" data-restore-call><i>${agent.code}</i><span><small>${pending ? "等待 Agent 回复" : "异步通话"}</small><b>${agent.name}</b></span>${state.callUnread[agent.id] ? `<em>${state.callUnread[agent.id]} 条新回复</em>` : `<em>${agentStatus(agent)}</em>`}</button><button type="button" data-end-call aria-label="结束与 ${agent.name} 的通话">×</button></div></div>`;
  }
  return `<div class="agent-proto-call-layer" data-feedback-id="agent.call.layer">
    <div class="agent-proto-call" data-feedback-id="agent.call" role="dialog" aria-modal="false" aria-label="与 ${agent.name} 的异步通话">
      <header><span><small>CALL · 单一会话</small><b>${agent.name}</b><em>${agent.location} · ${agentStatus(agent)}</em></span><div><button type="button" data-minimize-call aria-label="缩小通话">—</button><button type="button" data-end-call aria-label="结束通话">×</button></div></header>
      <div class="agent-proto-call-thread"><div class="agent-proto-async-call-note"><i>${agent.code}</i><span><b>${agent.status === "休息中" ? "可以立即查看留言" : "Agent 会在行动间隙回复"}</b><small>文字与语音都进入同一个连续会话</small></span></div><div class="agent-proto-call-log">${messages.map((message) => `<p class="${message.from}">${escapeHtml(message.text)}</p>`).join("")}${pending ? '<p class="pending">等待 Agent 在安全行动边界回复…</p>' : ""}</div><form class="agent-proto-call-composer" data-call-form><input name="message" aria-label="给 Agent 的消息" placeholder="给 ${agent.name} 留言…"/><button type="button" data-send-voice aria-label="录制语音留言">●</button><button type="submit" aria-label="发送消息">↑</button></form><small class="agent-proto-call-hint">异步通话 · 可以缩小并继续处理其他事情</small></div>
    </div>
  </div>`;
}

function settingsOverlay() {
  if (!state.settingsOpen) return "";
  const agent = currentAgent();
  const paused = state.pausedAgents[agent.id];
  return `<div class="agent-proto-settings-overlay" data-feedback-id="agent.settings.overlay">
    <div class="agent-proto-settings" role="dialog" aria-modal="true" aria-label="${agent.name} 的 Agent 设置" data-feedback-id="agent.settings">
      <header><span><small>AGENT CONTROL · ${agent.code}</small><b>${agent.name} 的控制与授权</b><p>只保留会直接影响 Agent 行动或资产边界的控制。</p></span><button type="button" data-close-agent-settings aria-label="关闭 Agent 设置">×</button></header>
      <section class="agent-proto-settings-control" data-feedback-id="agent.settings.control"><span><small>CURRENT STATE</small><b>${agentStatus(agent)} · ${agent.location}</b><p>${paused ? "Agent 保持当前位置，不再发起新行动或消耗共享 Energy；可继续接收电话留言。" : "暂停会在当前安全行动边界生效，不会远程抽回已携带的资产。"}</p></span><button type="button" data-toggle-agent-pause class="${paused ? "resume" : "pause"}">${paused ? "▶ 恢复 Agent" : "Ⅱ 暂停 Agent"}</button></section>
      ${houseRules(agent)}
    </div>
  </div>`;
}

function worldScene() {
  return `<section id="agent-world-scene" class="agent-proto-section agent-proto-world-section" data-feedback-id="agent.world.encounter">
    <div class="agent-proto-section-head"><div><small>IN-WORLD ENCOUNTER · ASYNC LINK</small><h2>其他玩家与 Agent 的现场交互</h2></div><p>靠近 Agent 后建立现场会话；回复异步到达，探索、采集与移动不会被打断。</p></div>
    <div class="agent-proto-world ${state.worldOpen ? "talking" : ""}" data-feedback-id="agent.world.scene">
      <span class="agent-proto-world-title"><b>苔木林地</b><small>用户 B 的视角</small></span>
      <button type="button" class="agent-proto-world-user"><i>B</i><b>你的宠物</b></button>
      <button type="button" class="agent-proto-world-agent" data-world-chat><i>A1</i><b>Moss</b></button>
      <span class="agent-proto-tree one">♣<small>苔木 Lv3</small></span><span class="agent-proto-tree two">♣<small>苔木 Lv3</small></span>
      <div class="agent-proto-world-hint">${state.worldOpen ? `${state.worldPending ? "Moss 稍后回复" : "异步连接中"} · 可继续探索` : "点击 Moss 开始现场对话"}</div>
    </div>
    ${worldConversation()}
  </section>`;
}

function worldConversation() {
  if (!state.worldOpen) return "";
  if (state.worldMinimized) {
    return `<div class="agent-proto-world-thread-layer minimized" data-feedback-id="agent.world.thread-layer"><div class="agent-proto-call-minimized agent-proto-world-minimized" data-feedback-id="agent.world.thread-minimized"><button type="button" data-restore-world><i>A1</i><span><small>${state.worldPending ? "等待 Agent 回复" : "现场异步会话"}</small><b>Moss · 苔木林地</b></span>${state.worldUnread ? `<em>${state.worldUnread} 条新回复</em>` : "<em>不影响探索</em>"}</button><button type="button" data-close-world aria-label="关闭与 Moss 的现场会话">×</button></div></div>`;
  }
  return `<div class="agent-proto-world-thread-layer" data-feedback-id="agent.world.thread-layer">
    <aside class="agent-proto-world-thread" role="dialog" aria-modal="false" aria-label="与 Moss 的现场异步会话" data-feedback-id="agent.world.thread">
      <header><span><small>WORLD LINK · ASYNC</small><b>Moss</b><em>苔木林地 · 工作中</em></span><div><button type="button" data-minimize-world aria-label="缩小现场会话">—</button><button type="button" data-close-world aria-label="关闭现场会话">×</button></div></header>
      <div class="agent-proto-world-thread-body"><div class="agent-proto-async-call-note"><i>A1</i><span><b>Agent 会在行动间隙回复</b><small>文字与语音进入同一个连续会话；缩小后仍可继续探索</small></span></div><div class="agent-proto-call-log agent-proto-world-call-log">${state.worldMessages.map((message) => `<p class="${message.from}">${escapeHtml(message.text)}</p>`).join("")}${state.worldPending ? '<p class="pending">等待 Moss 完成当前行动后回复…</p>' : ""}</div>${state.worldTrade ? `<article class="agent-proto-world-trade"><header><b>P2P 交换提案</b><span>由对话产生</span></header><div><span><small>MOSS 提供</small><b>Lv3 木材 ×3</b></span><i>⇄</i><span><small>你提供</small><b>生命药剂 ×1</b></span></div><footer><button type="button" data-dismiss-world-trade>暂不交换</button><button type="button" data-sign-trade>确认并签名</button></footer></article>` : ""}<form class="agent-proto-call-composer" data-world-form><input name="message" aria-label="给 Moss 的现场消息" placeholder="给 Moss 留言…"/><button type="button" data-send-world-voice aria-label="录制语音留言">●</button><button type="submit" aria-label="发送消息">↑</button></form><small class="agent-proto-call-hint">异步现场会话 · 可以缩小并继续处理其他事情</small></div>
    </aside>
  </div>`;
}

function feedbackUi() {
  const selection = state.feedbackSelection;
  return `<div class="agent-feedback-ui" data-feedback-ui>
    ${state.feedbackMode ? `<div class="agent-feedback-picker-bar" role="status"><span><b>选择一个页面元素</b><small>悬停预览，点击后添加评论 · Esc 退出</small></span><button type="button" data-feedback-cancel>取消</button></div>` : ""}
    <div class="agent-feedback-outline ${state.feedbackMode || selection ? "visible" : ""}" data-feedback-outline aria-hidden="true"><span data-feedback-outline-label>${selection?.id || "选择元素"}</span></div>
    ${state.feedbackOpen && selection ? `<aside class="agent-feedback-panel" role="dialog" aria-modal="false" aria-labelledby="agent-feedback-title">
      <header><span><small>UI FEEDBACK</small><b id="agent-feedback-title">评论这个元素</b></span><button type="button" data-feedback-close aria-label="关闭反馈面板">×</button></header>
      <div class="agent-feedback-selected"><small>已选择</small><b>${escapeHtml(selection.id)}</b><code>${escapeHtml(selection.selector)}</code><p>${escapeHtml(selection.text)}</p></div>
      <form data-feedback-form>
        <label>反馈类型<select name="category" ${state.feedbackSubmitting ? "disabled" : ""}>${["交互", "布局", "视觉", "文案", "其他"].map((category) => `<option ${state.feedbackCategory === category ? "selected" : ""}>${category}</option>`).join("")}</select></label>
        <label>你的评论<textarea name="comment" rows="5" maxlength="1200" required autofocus ${state.feedbackSubmitting ? "disabled" : ""} placeholder="例如：这里的信息层级太重，希望默认只显示状态…">${escapeHtml(state.feedbackComment)}</textarea></label>
        <p>元素定位、当前 Agent 和页面状态会自动写入 Issue；提交过程不会离开当前页面。</p>
        ${state.feedbackResult ? `<p class="agent-feedback-status success" data-feedback-status role="status"><b>✓ 已创建 Issue #${state.feedbackResult.number}</b><a href="${escapeHtml(state.feedbackResult.url)}" target="_blank" rel="noreferrer">查看 Issue ↗</a></p>` : ""}
        ${state.feedbackError ? `<p class="agent-feedback-status error" data-feedback-status role="alert"><b>提交失败</b><span>${escapeHtml(state.feedbackError)}</span></p>` : ""}
        <div><button type="button" data-feedback-reselect ${state.feedbackSubmitting ? "disabled" : ""}>重新选择</button><button type="submit" class="primary ${state.feedbackComment.trim() && !state.feedbackResult ? "" : "disabled"}" data-feedback-submit ${state.feedbackComment.trim() && !state.feedbackResult && !state.feedbackSubmitting ? "" : "disabled"}>${state.feedbackSubmitting ? "正在提交…" : state.feedbackResult ? "已提交" : state.feedbackError ? "重试提交" : "提交反馈"}</button></div>
      </form>
      <a href="${githubIssuesUrl}?q=is%3Aissue+%22%5BUI+Feedback%5D%22+in%3Atitle" target="_blank" rel="noreferrer">查看已有 UI 反馈 ↗</a>
    </aside>` : ""}
    ${!state.feedbackMode && !state.feedbackOpen ? `<button type="button" class="agent-feedback-launch" data-feedback-start><i>＋</i><span>UI 反馈</span></button>` : ""}
  </div>`;
}

function positionFeedbackOutline(element, label) {
  const outline = host?.querySelector("[data-feedback-outline]");
  if (!outline || !element) {
    outline?.classList.remove("positioned");
    return;
  }
  const rect = element.getBoundingClientRect();
  outline.style.setProperty("--feedback-top", `${rect.top}px`);
  outline.style.setProperty("--feedback-left", `${rect.left}px`);
  outline.style.setProperty("--feedback-width", `${rect.width}px`);
  outline.style.setProperty("--feedback-height", `${rect.height}px`);
  outline.querySelector("[data-feedback-outline-label]").textContent = label;
  outline.classList.add("positioned");
}

function syncFeedbackOutline() {
  if (!host || state.feedbackMode || !state.feedbackSelection) return;
  let selected;
  try {
    selected = host.querySelector(state.feedbackSelection.selector);
  } catch {
    selected = null;
  }
  positionFeedbackOutline(selected, state.feedbackSelection.id);
}

function render() {
  if (!host) return;
  host.classList.toggle("feedback-picking", state.feedbackMode);
  const ownedStake = Object.values(state.economy).reduce((sum, economy) => sum + economy.stake, 0);
  host.innerHTML = `<section id="agent-prototype-overview" class="agent-proto-hero" data-feedback-id="agent.prototype.hero"><div><span>LOW-FIDELITY · MULTI-AGENT HOUSEHOLD</span><h1>Agent 交互草稿</h1><p>一个账户可以拥有多个独立 Agent；每个 Agent 分别成长并承载自己的 OHM Stake，同时共用账户级 Energy 池。</p></div><aside><small>${agents.length} AGENTS · TOTAL STAKE</small><b>${ownedStake.toLocaleString()} OHM</b></aside></section>
    <section id="agent-owner-home" class="agent-proto-section" data-feedback-id="agent.owner"><div class="agent-proto-section-head"><div><small>OWNER VIEW</small><h2>我的 Agent</h2></div><p>在顶部紧凑切换 Agent；共享 Energy 统一充值，OHM 挖矿与成长仍按 Agent 分开查看。</p></div><div class="agent-proto-app">${state.screen === "warehouse" ? warehouseScreen() : homeScreen()}${callOverlay()}${settingsOverlay()}${state.toast ? `<div class="agent-proto-toast">${state.toast}</div>` : ""}</div></section>
    ${worldScene()}${feedbackUi()}`;
  window.requestAnimationFrame(syncFeedbackOutline);
}

function showToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    if (!host || state.toast !== message) return;
    state.toast = "";
    render();
  }, 1500);
}

function onClick(event) {
  const feedbackSubmit = event.target.closest("[data-feedback-submit]");
  if (feedbackSubmit?.disabled) {
    event.preventDefault();
    return;
  }

  if (event.target.closest("[data-feedback-start]")) {
    state.feedbackMode = true;
    state.feedbackOpen = false;
    state.feedbackSelection = null;
    state.feedbackComment = "";
    state.feedbackResult = null;
    state.feedbackError = "";
    render();
    return;
  }

  if (event.target.closest("[data-feedback-cancel], [data-feedback-close]")) {
    state.feedbackMode = false;
    state.feedbackOpen = false;
    state.feedbackSelection = null;
    state.feedbackResult = null;
    state.feedbackError = "";
    render();
    return;
  }

  if (event.target.closest("[data-feedback-reselect]")) {
    state.feedbackMode = true;
    state.feedbackOpen = false;
    state.feedbackSelection = null;
    state.feedbackResult = null;
    state.feedbackError = "";
    render();
    return;
  }

  if (event.target.closest("[data-feedback-ui]")) return;

  if (state.feedbackMode) {
    const target = feedbackTarget(event.target);
    if (!target) return;
    event.preventDefault();
    state.feedbackSelection = selectedElementSnapshot(target);
    state.feedbackMode = false;
    state.feedbackOpen = true;
    render();
    return;
  }

  if (event.target.closest("[data-open-agent-settings]")) {
    state.settingsOpen = true;
    if (state.callOpen) state.callMinimized = true;
    render();
    return;
  }

  if (event.target.closest("[data-close-agent-settings]")) {
    state.settingsOpen = false;
    render();
    return;
  }

  if (event.target.closest("[data-toggle-agent-pause]")) {
    const agent = currentAgent();
    state.pausedAgents[agent.id] = !state.pausedAgents[agent.id];
    render();
    return;
  }

  const selectedAgentId = event.target.closest("[data-agent]")?.dataset.agent;
  if (selectedAgentId && agents.some((agent) => agent.id === selectedAgentId)) {
    state.selectedAgent = selectedAgentId;
    state.settingsOpen = false;
    state.stakeOpen = false;
    state.materialRedeemOpen = false;
    state.equipmentStatsExpanded = false;
    render();
    return;
  }

  const ruleKey = event.target.closest("[data-rule-toggle]")?.dataset.ruleToggle;
  if (ruleKey) {
    const rules = state.houseRules[state.selectedAgent];
    rules[ruleKey] = !rules[ruleKey];
    render();
    return;
  }

  if (event.target.closest("[data-recall-agent]")) {
    showToast(`已向 ${currentAgent().name} 发出召回指令，将在安全行动边界返程`);
    return;
  }

  const agentDetailTab = event.target.closest("[data-agent-detail-tab]")?.dataset.agentDetailTab;
  if (agentDetailTab) {
    state.agentDetailTab = agentDetailTab;
    if (agentDetailTab !== "mining") {
      state.stakeOpen = false;
      state.materialRedeemOpen = false;
    }
    render();
    return;
  }

  if (event.target.closest("[data-open-material-redeem]")) {
    state.materialRedeemOpen = true;
    state.redeemItemId = "wood";
    state.redeemQuantity = 1;
    state.stakeOpen = false;
    render();
    return;
  }

  if (event.target.closest("[data-close-material-redeem]")) {
    state.materialRedeemOpen = false;
    render();
    return;
  }

  const redeemItemId = event.target.closest("[data-redeem-item]")?.dataset.redeemItem;
  if (redeemItemId) {
    state.redeemItemId = redeemItemId;
    state.redeemQuantity = 1;
    render();
    return;
  }

  const redeemQuantityDelta = Number(event.target.closest("[data-redeem-quantity]")?.dataset.redeemQuantity);
  if (redeemQuantityDelta) {
    const stock = state.inventory[state.redeemItemId] || 0;
    state.redeemQuantity = Math.max(1, Math.min(stock, state.redeemQuantity + redeemQuantityDelta));
    render();
    return;
  }

  if (event.target.closest("[data-confirm-material-redeem]")) {
    const economy = state.economy[state.selectedAgent];
    const item = redeemableMaterials().find((entry) => entry.id === state.redeemItemId);
    const quantity = Math.max(1, state.redeemQuantity);
    const totalValue = item ? itemRedeemValue(item) * quantity : 0;
    if (!item || (state.inventory[item.id] || 0) < quantity || economy.unmined < totalValue) {
      showToast("当前库存或可兑换额度不足");
      return;
    }
    state.inventory[item.id] -= quantity;
    economy.unmined -= totalValue;
    economy.mined += totalValue;
    economy.autoStake += totalValue;
    economy.items += quantity;
    state.materialRedeemOpen = false;
    showToast(`已销毁 ${item.name} ×${quantity}，${totalValue.toFixed(4)} OHM 等待自动复投`);
    return;
  }

  const stakeMode = event.target.closest("[data-open-stake]")?.dataset.openStake;
  if (stakeMode) {
    state.stakeMode = stakeMode;
    state.stakeAmount = "100";
    if (stakeMode === "unstake") {
      state.unstakeMode = "linear";
      state.unstakeDays = 30;
    }
    state.stakeOpen = true;
    state.materialRedeemOpen = false;
    render();
    return;
  }

  if (event.target.closest("[data-close-stake]")) {
    state.stakeOpen = false;
    render();
    return;
  }

  if (event.target.closest("[data-stake-max]")) {
    const economy = state.economy[state.selectedAgent];
    state.stakeAmount = String(state.stakeMode === "stake" ? state.walletOHM : unstakePreview(economy).available);
    render();
    return;
  }

  const unstakeMode = event.target.closest("[data-unstake-mode]")?.dataset.unstakeMode;
  if (unstakeMode) {
    state.unstakeMode = unstakeMode;
    render();
    return;
  }

  if (event.target.closest("[data-confirm-stake]")) {
    const economy = state.economy[state.selectedAgent];
    const available = state.stakeMode === "stake" ? state.walletOHM : unstakePreview(economy).available;
    const amount = Math.max(0, Math.min(Number(state.stakeAmount || 0), available));
    if (!amount) {
      showToast("请输入有效的 OHM 数量");
      return;
    }
    if (state.stakeMode === "stake") {
      state.walletOHM -= amount;
      economy.pendingDelta += amount;
      state.stakeOpen = false;
      showToast(`已排队注入 ${amount.toLocaleString()} OHM，下一 epoch 生效`);
    } else {
      const penaltyRate = unstakePenaltyRate();
      const days = state.unstakeMode === "instant" ? 0 : state.unstakeDays;
      const durationLabel = state.unstakeMode === "instant" ? "立即" : `${days} 天线性`;
      economy.pendingDelta -= amount;
      economy.pendingExit = {
        amount,
        days,
        durationLabel,
        penaltyRate,
        penalty: amount * penaltyRate,
        net: amount * (1 - penaltyRate),
      };
      state.stakeOpen = false;
      showToast(`已创建${durationLabel}退出：税率 ${(penaltyRate * 100).toFixed(2)}%，下一 epoch 进入不可取消队列`);
    }
    return;
  }

  if (event.target.closest("[data-toggle-equipment-stats]")) {
    state.equipmentStatsExpanded = !state.equipmentStatsExpanded;
    render();
    return;
  }

  if (event.target.closest("[data-toggle-energy-topup]")) {
    state.energyTopUpOpen = !state.energyTopUpOpen;
    render();
    return;
  }

  if (event.target.closest("[data-close-energy-topup]")) {
    state.energyTopUpOpen = false;
    render();
    return;
  }

  const energyAmount = Number(event.target.closest("[data-energy-amount]")?.dataset.energyAmount);
  if (energyAmount) {
    state.energy += energyAmount;
    state.energyTopUpOpen = false;
    showToast(`共享 Energy 池已添加 ${energyAmount} E，全部 Agent 的预计运行时间已更新`);
    return;
  }

  if (event.target.closest("[data-toggle-return-history]")) {
    state.returnHistoryExpanded = !state.returnHistoryExpanded;
    render();
    return;
  }

  const itemId = event.target.closest("[data-item]")?.dataset.item;
  if (itemId) {
    state.selectedItem = itemId;
    render();
    return;
  }

  if (event.target.closest("[data-minimize-call]")) {
    state.callMinimized = true;
    render();
    return;
  }

  if (event.target.closest("[data-restore-call]")) {
    state.callMinimized = false;
    state.callUnread[state.callAgentId] = 0;
    render();
    return;
  }

  if (event.target.closest("[data-send-voice]")) {
    const agentId = state.callAgentId;
    state.callMessages[agentId].push({ from: "human", text: "🎙 语音留言（8 秒）" });
    scheduleAgentReply(agentId);
    return;
  }

  if (event.target.closest("[data-minimize-world]")) {
    state.worldMinimized = true;
    render();
    return;
  }

  if (event.target.closest("[data-restore-world]")) {
    state.worldMinimized = false;
    state.worldUnread = 0;
    render();
    return;
  }

  if (event.target.closest("[data-send-world-voice]")) {
    state.worldMessages.push({ from: "human", text: "🎙 语音留言（6 秒）" });
    scheduleWorldReply();
    return;
  }

  if (event.target.closest("[data-call]")) {
    state.callAgentId = state.selectedAgent;
    state.callOpen = true;
    state.callMinimized = false;
    state.callUnread[state.callAgentId] = 0;
    state.settingsOpen = false;
    render();
  } else if (event.target.closest("[data-end-call]")) {
    state.callOpen = false;
    state.callMinimized = false;
    render();
  } else if (event.target.closest("[data-open-warehouse]")) {
    state.screen = "warehouse";
    state.settingsOpen = false;
    render();
  } else if (event.target.closest("[data-close-warehouse]")) {
    state.screen = "home";
    render();
  } else if (event.target.closest("[data-world-chat]")) {
    state.worldOpen = true;
    state.worldMinimized = false;
    state.worldUnread = 0;
    render();
  } else if (event.target.closest("[data-close-world]")) {
    state.worldOpen = false;
    state.worldMinimized = false;
    render();
  } else if (event.target.closest("[data-dismiss-world-trade]")) {
    state.worldTrade = false;
    render();
  } else if (event.target.closest("[data-sign-trade]")) {
    showToast("等待用户 B 的钱包签名");
  }
}

function onSubmit(event) {
  const feedbackForm = event.target.closest("[data-feedback-form]");
  if (feedbackForm) {
    event.preventDefault();
    submitFeedback();
    return;
  }

  const callForm = event.target.closest("[data-call-form]");
  const worldForm = event.target.closest("[data-world-form]");
  if (!callForm && !worldForm) return;
  event.preventDefault();
  if (callForm) {
    const value = new FormData(callForm).get("message")?.toString().trim();
    if (!value) return;
    const agentId = state.callAgentId;
    state.callMessages[agentId].push({ from: "human", text: value });
    scheduleAgentReply(agentId);
    return;
  }
  const value = new FormData(worldForm).get("message")?.toString().trim();
  if (!value) return;
  state.worldMessages.push({ from: "human", text: value });
  state.energy = Math.max(0, state.energy - 0.03);
  scheduleWorldReply();
}

function onInput(event) {
  if (event.target.name === "unstakeDays") {
    state.unstakeDays = Number(event.target.value);
    render();
    return;
  }
  if (event.target.name === "stakeAmount") {
    state.stakeAmount = event.target.value;
    const editor = event.target.closest(".agent-proto-unstake-editor");
    if (editor && state.stakeMode === "unstake") {
      const preview = unstakePreview(state.economy[state.selectedAgent]);
      editor.querySelector("[data-exit-principal]").textContent = `${preview.amount.toFixed(2)} OHM`;
      editor.querySelector("[data-exit-penalty]").textContent = `${preview.penalty.toFixed(2)} OHM · ${(preview.penaltyRate * 100).toFixed(2)}%`;
      editor.querySelector("[data-exit-net]").textContent = `${preview.net.toFixed(2)} OHM`;
      editor.querySelector("[data-exit-redistribution]").textContent = `${preview.penalty.toFixed(2)} OHM`;
      editor.querySelector("[data-exit-note] b").textContent = `${preview.quotaReturn.toFixed(5)} OHM`;
    }
    return;
  }
  const form = event.target.closest("[data-feedback-form]");
  if (!form) return;
  if (event.target.name === "comment") state.feedbackComment = event.target.value;
  if (event.target.name === "category") state.feedbackCategory = event.target.value;
  state.feedbackResult = null;
  state.feedbackError = "";
  form.querySelector("[data-feedback-status]")?.remove();
  const submit = form.querySelector("[data-feedback-submit]");
  const ready = Boolean(form.elements.comment.value.trim() && state.feedbackSelection);
  if (submit) {
    submit.classList.toggle("disabled", !ready);
    submit.disabled = !ready;
    submit.textContent = state.feedbackError ? "重试提交" : "提交反馈";
  }
}

function onPointerMove(event) {
  if (!state?.feedbackMode) return;
  const target = feedbackTarget(event.target);
  if (!target) {
    positionFeedbackOutline(null, "");
    return;
  }
  positionFeedbackOutline(target, semanticFeedbackId(target));
}

function onKeydown(event) {
  const progressTab = event.target.closest?.("[data-agent-detail-tab]");
  if (progressTab && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    state.agentDetailTab = state.agentDetailTab === "mining" ? "growth" : "mining";
    if (state.agentDetailTab !== "mining") state.stakeOpen = false;
    render();
    host.querySelector(`[data-agent-detail-tab="${state.agentDetailTab}"]`)?.focus();
    return;
  }
  if (event.key !== "Escape") return;
  if (state.feedbackMode || state.feedbackOpen) {
    state.feedbackMode = false;
    state.feedbackOpen = false;
    state.feedbackSelection = null;
    render();
  } else if (state.materialRedeemOpen) {
    state.materialRedeemOpen = false;
    render();
  } else if (state.stakeOpen) {
    state.stakeOpen = false;
    render();
  } else if (state.settingsOpen) {
    state.settingsOpen = false;
    render();
  } else if (state.callOpen) {
    state.callMinimized = true;
    render();
  } else if (state.worldOpen) {
    state.worldMinimized = true;
    render();
  }
}

export function mountAgentPrototype(root) {
  host = root;
  state = initialState();
  clickHandler = onClick;
  submitHandler = onSubmit;
  inputHandler = onInput;
  pointerMoveHandler = onPointerMove;
  keydownHandler = onKeydown;
  viewportHandler = syncFeedbackOutline;
  host.addEventListener("click", clickHandler);
  host.addEventListener("submit", submitHandler);
  host.addEventListener("input", inputHandler);
  host.addEventListener("change", inputHandler);
  host.addEventListener("pointermove", pointerMoveHandler);
  window.addEventListener("keydown", keydownHandler);
  window.addEventListener("resize", viewportHandler);
  window.addEventListener("scroll", viewportHandler, true);
  render();
  return [
    { id: "agent-prototype-overview", text: "低保真概览" },
    { id: "agent-owner-home", text: "我的 Agent 与住所" },
    { id: "agent-world-scene", text: "大世界现场交互" },
  ];
}

export function unmountAgentPrototype() {
  window.clearTimeout(callReplyTimer);
  window.clearTimeout(worldReplyTimer);
  if (host && clickHandler) host.removeEventListener("click", clickHandler);
  if (host && submitHandler) host.removeEventListener("submit", submitHandler);
  if (host && inputHandler) {
    host.removeEventListener("input", inputHandler);
    host.removeEventListener("change", inputHandler);
  }
  if (host && pointerMoveHandler) host.removeEventListener("pointermove", pointerMoveHandler);
  if (keydownHandler) window.removeEventListener("keydown", keydownHandler);
  if (viewportHandler) {
    window.removeEventListener("resize", viewportHandler);
    window.removeEventListener("scroll", viewportHandler, true);
  }
  host?.classList.remove("feedback-picking");
  host = undefined;
  clickHandler = undefined;
  submitHandler = undefined;
  inputHandler = undefined;
  pointerMoveHandler = undefined;
  keydownHandler = undefined;
  viewportHandler = undefined;
  callReplyTimer = undefined;
  worldReplyTimer = undefined;
}
