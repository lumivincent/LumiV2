const tierConfig = [
  { id: "base", name: "基础", multiplier: 0.8, probability: 0.66333333, glyph: "◇" },
  { id: "lucky", name: "幸运", multiplier: 1.1, probability: 0.18666667, glyph: "✦" },
  { id: "great", name: "大吉", multiplier: 1.6, probability: 0.12, glyph: "✹" },
  { id: "legend", name: "传说", multiplier: 2.4, probability: 0.03, glyph: "☀" },
];

const initialState = () => ({
  energy: 500,
  amount: "100",
  walletOHM: 1284.6,
  lockedOHM: 176.42,
  unlockProgress: 37,
  twap: 2,
  demand: 714.2857,
  demandHalfPoint: 5000,
  confirmOpen: false,
  result: null,
  drawIndex: 0,
  history: [
    { tier: "lucky", amount: 80, payout: 56.71, profit: 23.29, time: "10:42" },
    { tier: "base", amount: 50, payout: 26.04, profit: 23.96, time: "昨天 18:16" },
  ],
});

let host;
let state;
let clickHandler;
let inputHandler;
let keyHandler;

const format = (value, digits = 2) => Number(value).toLocaleString(undefined, {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

function lotteryMath() {
  const amount = Math.max(0, Number(state.amount || 0));
  const discount = 0.25 * state.demandHalfPoint / (state.demandHalfPoint + state.demand);
  const bondPrice = Math.max(state.twap * (1 - discount), 1);
  const expected = amount / bondPrice;
  const maximum = amount;
  let scale = 1;

  const expectationAt = (candidate) => tierConfig.reduce(
    (sum, tier) => sum + tier.probability * Math.min(candidate * tier.multiplier * expected, maximum),
    0,
  );

  if (amount > 0 && expectationAt(scale) < expected) {
    let low = 1;
    let high = 4;
    for (let index = 0; index < 80; index += 1) {
      const middle = (low + high) / 2;
      if (expectationAt(middle) < expected) low = middle;
      else high = middle;
    }
    scale = high;
  }

  const tiers = tierConfig.map((tier) => ({
    ...tier,
    payout: Math.min(scale * tier.multiplier * expected, maximum),
  }));
  return {
    amount,
    discount,
    abundance: 1 / (1 - discount),
    bondPrice,
    expected,
    maximum,
    tiers,
  };
}

function tierById(id) {
  return tierConfig.find((tier) => tier.id === id) || tierConfig[0];
}

function renderTierCards(calculation) {
  return calculation.tiers.map((tier) => `<article class="lottery-tier ${tier.id}" data-lottery-tier="${tier.id}">
    <i>${tier.glyph}</i>
    <span><small>${tier.name}</small><b>${format(tier.payout)} OHM</b></span>
    <em>${format(tier.probability * 100, tier.id === "base" || tier.id === "lucky" ? 2 : 0)}%</em>
  </article>`).join("");
}

function confirmation(calculation) {
  if (!state.confirmOpen) return "";
  const insufficient = calculation.amount > state.energy || calculation.amount <= 0;
  return `<div class="lottery-modal-layer"><section class="lottery-modal" role="dialog" aria-modal="true" aria-label="确认抽奖 Bond">
    <header><span><small>CONFIRM BOND</small><b>确认抽取</b></span><button type="button" data-close-lottery-modal>&times;</button></header>
    <div class="lottery-confirm-flow"><span><small>消耗</small><b>${format(calculation.amount)} Energy</b></span><i>→</i><span><small>期望获得</small><b>${format(calculation.expected)} OHM</b></span><i>→</i><span><small>发放方式</small><b>锁入 Depository</b></span></div>
    <dl><div><dt>Bond 价格</dt><dd>${format(calculation.bondPrice, 4)} MON / OHM</dd></div><div><dt>当前丰度</dt><dd>${format(calculation.abundance)}×</dd></div><div><dt>最大 payout</dt><dd>${format(calculation.maximum)} OHM</dd></div></dl>
    <p>抽奖是一笔 Bond 购买。对应 MON 划入 Bond 国库账本，实际 payout 当场铸造并线性解锁。</p>
    <footer><button type="button" data-close-lottery-modal>再看看</button><button type="button" data-confirm-draw ${insufficient ? "disabled" : ""}>${insufficient ? "Energy 不足" : "确认并抽取"}</button></footer>
  </section></div>`;
}

function resultModal() {
  if (!state.result) return "";
  const tier = tierById(state.result.tier);
  const delta = state.result.payout - state.result.expected;
  return `<div class="lottery-modal-layer"><section class="lottery-result ${tier.id}" role="dialog" aria-modal="true" aria-label="抽奖结果">
    <i>${tier.glyph}</i><small>${tier.name.toUpperCase()}</small><h2>${tier.name}</h2><strong>${format(state.result.payout)} OHM</strong>
    <p>${delta >= 0 ? `比期望多 ${format(delta)} OHM` : `本次低于期望 ${format(Math.abs(delta))} OHM`}</p>
    <div><span><small>已锁入</small><b>Depository</b></span><span><small>Bond 利润额度</small><b>${format(state.result.profit)} OHM</b></span></div>
    <button type="button" data-dismiss-result>继续</button>
  </section></div>`;
}

function historyRows() {
  return state.history.map((entry) => {
    const tier = tierById(entry.tier);
    return `<article><i>${tier.glyph}</i><span><small>${entry.time} · ${tier.name}</small><b>投入 ${format(entry.amount)} E</b></span><strong>+${format(entry.payout)} OHM</strong><em>利润 ${format(entry.profit)}</em></article>`;
  }).join("");
}

function render() {
  if (!host) return;
  const calculation = lotteryMath();
  const valid = calculation.amount > 0 && calculation.amount <= state.energy;
  host.innerHTML = `<section id="lottery-prototype-overview" class="lottery-hero"><div><span>INTERACTIVE PROTOTYPE · LOTTERY AS BOND</span><h1>抽奖交互草稿</h1><p>用 Energy 购买 Bond；随机只重分配 payout，期望与确定性 Bond 一致。Bond 利润进入 Agent OHM 待分配池。</p></div><aside><small>当前丰度</small><b>${format(calculation.abundance)}×</b><em>最高 1.33×</em></aside></section>
    <section id="lottery-draw-interface" class="lottery-section"><div class="lottery-section-head"><div><small>DRAW INTERFACE</small><h2>抽取 OHM Bond</h2></div><p>丰度由全服需求决定；抽取后需求上升，丰度逐步回落。</p></div>
      <div class="lottery-app">
        <header class="lottery-wallet"><a href="#lottery-prototype-overview"><i>L</i><span><small>LUMITERRA BOND</small><b>抽取 OHM</b></span></a><div><span><small>ENERGY</small><b>${format(state.energy)} E</b></span><span><small>可用 OHM</small><b>${format(state.walletOHM)}</b></span><span><small>锁定 OHM</small><b>${format(state.lockedOHM)}</b></span><button type="button" data-topup-energy>+200 E</button></div></header>
        <main class="lottery-main">
          <section class="lottery-abundance"><header><span><small>ORE ABUNDANCE · GLOBAL</small><b>矿脉丰度</b></span><strong>${format(calculation.abundance)}×</strong></header><div class="lottery-abundance-bar"><i style="width:${Math.max(4, (calculation.abundance - 1) / 0.33 * 100)}%"></i></div><footer><span>1.00×</span><b>若无人抽取，约 5h 20m 回到最高丰度</b><span>1.33×</span></footer></section>
          <div class="lottery-grid"><section class="lottery-draw-card"><header><span><small>BOND INPUT</small><b>投入 Energy</b></span><em>1 Energy = 1 MON</em></header><label><input name="lotteryAmount" type="number" min="1" step="1" value="${state.amount}" aria-label="抽奖 Energy 数量"/><span>ENERGY</span></label><div class="lottery-presets">${[10, 50, 100, 250].map((value) => `<button type="button" data-lottery-amount="${value}" class="${calculation.amount === value ? "active" : ""}">${value}</button>`).join("")}<button type="button" data-lottery-max>MAX</button></div><dl><div><dt>期望获得</dt><dd>${format(calculation.expected)} OHM</dd></div><div><dt>Bond 价格</dt><dd>${format(calculation.bondPrice, 4)} MON</dd></div><div><dt>对应市值</dt><dd>≈ ${format(calculation.expected * state.twap)} MON</dd></div></dl><button class="lottery-primary" type="button" data-open-draw ${valid ? "" : "disabled"}>${calculation.amount > state.energy ? "Energy 不足" : "抽 取"}</button><p>payout 当场计入总供应，并锁入 Depository 线性解锁。</p></section>
            <section class="lottery-outcomes"><header><span><small>POSSIBLE RESULTS</small><b>本次可能结果</b></span><em>期望 ${format(calculation.expected)} OHM</em></header><div>${renderTierCards(calculation)}</div><p>概率已精确配平；靠近 1 MON 地板时，四档 payout 会自动收敛，但数学期望不变。</p></section></div>
        </main>
        ${confirmation(calculation)}${resultModal()}
      </div>
    </section>
    <section id="lottery-depository" class="lottery-section"><div class="lottery-section-head"><div><small>AFTER DRAW</small><h2>Depository 与记账</h2></div><p>Bond payout 与 Bond 利润分开记账；游戏成长 Energy 不进入 mint 额度。</p></div><div class="lottery-ledger-grid"><section class="lottery-depository-card"><header><span><small>MY DEPOSITORY</small><b>线性解锁</b></span><em>周期待定</em></header><strong>${format(state.lockedOHM)} <small>OHM</small></strong><div><i style="width:${state.unlockProgress}%"></i></div><footer><span>${state.unlockProgress}% 已进入解锁进程</span><button type="button" data-simulate-unlock>模拟推进 +10%</button></footer><p>已解锁 OHM 可选择卖出，或注入 Agent 从下一个 epoch 获得 Stake 权重。</p></section><section class="lottery-history"><header><small>RECENT BONDS</small><b>最近抽取</b></header><div>${historyRows()}</div></section></div></section>`;
}

function draw() {
  const calculation = lotteryMath();
  if (calculation.amount <= 0 || calculation.amount > state.energy) return;
  const sequence = ["lucky", "base", "great", "base", "legend"];
  const tierId = sequence[state.drawIndex % sequence.length];
  const tier = calculation.tiers.find((entry) => entry.id === tierId) || calculation.tiers[0];
  const payout = tier.payout;
  const profit = Math.max(0, calculation.amount - payout);
  state.energy -= calculation.amount;
  state.lockedOHM += payout;
  state.demand += payout;
  state.drawIndex += 1;
  state.confirmOpen = false;
  state.result = { tier: tierId, payout, expected: calculation.expected, profit };
  state.history.unshift({ tier: tierId, amount: calculation.amount, payout, profit, time: "刚刚" });
  render();
}

function onClick(event) {
  const amountButton = event.target.closest("[data-lottery-amount]");
  if (amountButton) {
    state.amount = amountButton.dataset.lotteryAmount;
    render();
    return;
  }
  if (event.target.closest("[data-lottery-max]")) {
    state.amount = String(Math.floor(state.energy));
    render();
    return;
  }
  if (event.target.closest("[data-topup-energy]")) {
    state.energy += 200;
    render();
    return;
  }
  if (event.target.closest("[data-open-draw]")) {
    state.confirmOpen = true;
    render();
    return;
  }
  if (event.target.closest("[data-close-lottery-modal]")) {
    state.confirmOpen = false;
    render();
    return;
  }
  if (event.target.closest("[data-confirm-draw]")) {
    draw();
    return;
  }
  if (event.target.closest("[data-dismiss-result]")) {
    state.result = null;
    render();
    return;
  }
  if (event.target.closest("[data-simulate-unlock]")) {
    state.unlockProgress = Math.min(100, state.unlockProgress + 10);
    render();
  }
}

function onInput(event) {
  if (event.target.name !== "lotteryAmount") return;
  state.amount = event.target.value;
  render();
  window.requestAnimationFrame(() => host?.querySelector('[name="lotteryAmount"]')?.focus());
}

function onKeydown(event) {
  if (event.key !== "Escape") return;
  if (state.result) state.result = null;
  else state.confirmOpen = false;
  render();
}

export function mountLotteryPrototype(root) {
  host = root;
  state = initialState();
  clickHandler = onClick;
  inputHandler = onInput;
  keyHandler = onKeydown;
  host.addEventListener("click", clickHandler);
  host.addEventListener("input", inputHandler);
  window.addEventListener("keydown", keyHandler);
  render();
  return [
    { id: "lottery-prototype-overview", text: "抽奖交互概览" },
    { id: "lottery-draw-interface", text: "抽取 OHM Bond" },
    { id: "lottery-depository", text: "Depository 与记账" },
  ];
}

export function unmountLotteryPrototype() {
  if (host && clickHandler) host.removeEventListener("click", clickHandler);
  if (host && inputHandler) host.removeEventListener("input", inputHandler);
  if (keyHandler) window.removeEventListener("keydown", keyHandler);
  host = undefined;
  state = undefined;
  clickHandler = undefined;
  inputHandler = undefined;
  keyHandler = undefined;
}
