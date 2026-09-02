function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function codeSection(source: string, startPattern: RegExp, endPattern: RegExp, limit: number) {
  const start = source.search(startPattern);
  if (start < 0) return '';
  const remainder = source.slice(start);
  const relativeEnd = remainder.slice(1).search(endPattern);
  const end = relativeEnd < 0 ? Math.min(source.length, start + limit) : Math.min(source.length, start + relativeEnd + 1);
  return source.slice(start, Math.min(end, start + limit)).trim();
}

function visibleCopy(source: string) {
  const markupText = [...source.matchAll(/>([^<>{}\n]+)</g)].map((match) => match[1]);
  const quotedText = [...source.matchAll(/(?:"([^"\n]{2,160})"|'([^'\n]{2,160})')/g)].map((match) => match[1] || match[2]);
  return unique([...markupText, ...quotedText]).filter((value) => {
    if (!/[\u4e00-\u9fff]|\s/.test(value)) return false;
    if (/^(https?:|[.#/]|data-|aria-|agent-|lottery-)/i.test(value)) return false;
    if (/[{}();=<>]/.test(value)) return false;
    return value.length <= 140;
  }).slice(0, 180);
}

export function buildInteractionAnalysis(title: string, source: string, hash = '') {
  const navigation = unique([...source.matchAll(/\{\s*id:\s*"([^"]+)",\s*text:\s*"([^"]+)"\s*\}/g)].map((match) => `${match[2]}（${match[1]}）`));
  const elementIds = unique([...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])).slice(0, 120);
  const actions = unique([...source.matchAll(/\bdata-([a-z][a-z0-9-]+)(?:=|\b)/gi)].map((match) => match[1])).filter((name) => !['feedback-id'].includes(name)).slice(0, 160);
  const copy = visibleCopy(source);
  const configuration = source.slice(0, Math.min(source.search(/\bfunction\s+/) > 0 ? source.search(/\bfunction\s+/) : 16_000, 22_000)).trim();
  const state = codeSection(source, /const initialState\s*=|let state\s*=/, /\n(?:const|let|function)\s+[a-zA-Z]/, 12_000);
  const clickLogic = codeSection(source, /function onClick\s*\(/, /\nfunction onInput\s*\(/, 32_000);

  return [
    `# ${title} · 交互分析说明`,
    '',
    '> 本说明由同步到本地的原始交互代码确定性提取，用于快速查看和 AI 分析；它不是新的产品需求。存在歧义时以原始代码、需求文档和团队确认为准。',
    '',
    `- 原始文件哈希：${hash || '尚未记录'}`,
    `- 原始代码长度：${source.length.toLocaleString('en-US')} 字符`,
    '',
    '## 页面与主要区域',
    '',
    ...(navigation.length ? navigation.map((item) => `- ${item}`) : ['- 未识别到显式导航区域']),
    '',
    '## 可交互入口',
    '',
    ...actions.map((action) => `- \`data-${action}\``),
    '',
    '## 页面元素标识',
    '',
    ...elementIds.map((id) => `- \`${id}\``),
    '',
    '## 可见文案索引',
    '',
    ...copy.map((item) => `- ${item.replace(/\s+/g, ' ')}`),
    '',
    '## 初始状态（原始代码）',
    '',
    '```js',
    state || '未识别到独立初始状态块',
    '```',
    '',
    '## 关键配置（原始代码）',
    '',
    '```js',
    configuration || '未识别到配置块',
    '```',
    '',
    '## 点击与状态转换（原始代码）',
    '',
    '```js',
    clickLogic || '未识别到点击处理函数',
    '```',
  ].join('\n');
}

function present(source: string, token: string, text: string) {
  return source.includes(token) ? [`- ${text}`] : [];
}

export function buildInteractionOverview(id: 'agent' | 'lottery', title: string, source: string, hash = '') {
  const common = [
    `# ${title} · 快速理解`,
    '',
    '> 这是对当前交互原型的阅读说明，不等同于已经确认的产品需求。数值、规则和公开表达仍需与需求文档、数值文档交叉核对。',
    '',
    `- 当前原型版本：\`${hash.slice(0, 12) || '尚未记录'}\``,
    `- 原始代码：${source.length.toLocaleString('en-US')} 字符，完整保留用于追溯`,
    '',
  ];
  if (id === 'lottery') {
    return [...common,
      '## 这个原型在表达什么',
      '',
      '- 玩家使用 Energy 进行一次抽奖式 Bond；随机性改变单次 payout，但原型宣称整体期望与确定性 Bond 对齐。',
      '- 抽取结果不会直接成为可用余额，而是进入 Depository，并显示线性解锁进度。',
      '- 页面把投入、期望、Bond 价格、丰度、可能结果、利润和历史记录放在同一条操作链中。',
      '',
      '## 玩家操作路径',
      '',
      '1. 查看账户 Energy、可用 OHM、锁定 OHM 与当前全局丰度。',
      '2. 输入或快捷选择 Energy 数量，页面即时更新期望 OHM 与可能结果。',
      '3. 点击抽取后再次确认投入、期望、价格与发放方式。',
      '4. 查看本次档位和 payout；结果计入 Depository，同时写入最近抽取。',
      '5. 在 Depository 查看解锁进度，解锁后的 OHM 可卖出或注入 Agent。',
      '',
      '## 当前可操作内容',
      '',
      ...present(source, 'data-lottery-amount', '快捷选择 10 / 50 / 100 / 250 Energy 或 MAX。'),
      ...present(source, 'data-topup-energy', '原型内模拟补充 200 Energy。'),
      ...present(source, 'data-open-draw', '打开抽取确认弹窗。'),
      ...present(source, 'data-confirm-draw', '确认抽取并生成结果。'),
      ...present(source, 'data-simulate-unlock', '模拟推进 Depository 解锁进度。'),
      '',
      '## 分析时应重点核对',
      '',
      '- 抽奖概率、Bond 定价、丰度回落和 payout 数值是否与数值文档一致。',
      '- “利润进入待分配池”“当场铸造”“线性解锁”等表达是否已经被需求确认。',
      '- 玩家是否能理解抽奖不是额外奖励，而是带随机分配结果的 Bond 购买。',
      '- 页面显示的示例余额、概率和解锁周期不能直接作为公开承诺。',
    ].join('\n');
  }
  return [...common,
    '## 这个原型在表达什么',
    '',
    '- 一个账户可以管理多个独立 Agent：分别成长、分别持有 OHM Stake，同时共享账户级 Energy。',
    '- 原型把 Agent 管理拆成住所管理和大世界现场交互两部分。',
    '- OHM 挖矿、成长、仓库、设置、通话与现场交换都围绕当前选中的 Agent 展开。',
    '',
    '## 主要页面与信息结构',
    '',
    '- 我的 Agent：切换 Agent、查看状态、位置、任务与共享 Energy。',
    '- OHM 挖矿：查看 Stake、epoch 额度、材料兑换、自动复投与返程记录。',
    '- 成长：查看成长进度、基础属性、装备与职业数值。',
    '- 主城仓库：查看共享库存、Agent 背包以及材料兑换资格。',
    '- Agent 设置：暂停运行、控制陌生人交流、P2P 提案与稀有物品确认。',
    '- 大世界现场交互：靠近其他 Agent 后异步聊天，并可形成交换提案。',
    '',
    '## 当前可操作内容',
    '',
    ...present(source, 'data-agent=', '切换多个 Agent，并让右侧信息同步切换。'),
    ...present(source, 'data-toggle-energy-topup', '向账户共享 Energy 池充值。'),
    ...present(source, 'data-open-stake', '注入或撤出当前 Agent 的 OHM Stake。'),
    ...present(source, 'data-open-material-redeem', '从仓库选择材料兑换 OHM，并进入自动复投。'),
    ...present(source, 'data-open-warehouse', '打开主城仓库并查看仓库与背包。'),
    ...present(source, 'data-call', '给当前 Agent 发起可缩小的异步通话。'),
    ...present(source, 'data-open-agent-settings', '打开 Agent 设置并调整运行及授权边界。'),
    ...present(source, 'data-world-chat', '在大世界建立异步现场会话。'),
    ...present(source, 'data-sign-trade', '对聊天产生的 P2P 交换提案进行签名。'),
    '',
    '## 分析时应重点核对',
    '',
    '- 原型中的 Stake、退出税、epoch、材料兑换和自动复投数值是否与数值文档一致。',
    '- 账户共享与 Agent 独立的边界是否清楚，尤其是 Energy、仓库、背包、成长和 Stake。',
    '- 电话、现场聊天、Agent 设置与 P2P 提案是否已经属于确认需求，还是仅为交互探索。',
    '- 页面中的 Agent、余额、产出、时间和属性均可能是演示数据，不能直接作为公开承诺。',
  ].join('\n');
}
