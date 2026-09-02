# OHM 源头资料

这里集中保存高密度信息和源头入口。资料按“想回答什么”组织，每条说明来源性质与核心信息；点击标题可直接查看原文。

## 快速找资料

- 想理解 OHM 怎么运行：看“机制、合约与安全”。
- 想还原冷启动和爆发：看“发行与时间线”“Marketing、社区与 FOMO”。
- 想核对规模数据：看“增长与市场数据”。
- 想判断合作是否真有价值：看“Olympus Pro 与外部协议”。
- 想理解为什么崩盘：看“可持续性、下跌与清算”。

## 发行与时间线

| 时间 | 来源 | 性质 | 核心信息 |
|---|---|---|---|
| 2021-02-17 | [Breaking the Silence](https://olympusdao.medium.com/breaking-the-silence-an-update-on-whats-coming-d079aa7a9232) | Olympus 官方同期文章 | Zeus 承认减少沟通并不是护城河，宣布加强文章、社区 Call、Discord、Twitter 与社区建设 |
| 2021-03-03 | [Initial Discord Offering](https://olympusdao.medium.com/initial-discord-offering-the-olympus-fair-launch-event-484987c32e89) | Olympus 官方发行规则 | 50,000 OHM、4 美元、Discord 截止资格、按比例分配、反机器人与反巨鲸设计；正文和旧 TL;DR 的开盘价版本存在差异 |
| 2021-03-11 | [The Genesis DAO](https://olympusdao.medium.com/the-genesis-dao-70f0ee6b5b8) | Olympus 官方 | Genesis DAO、早期治理与参与方式 |
| 2021-03-13 | [What is pOHM?](https://olympusdao.medium.com/what-is-poh-16b2c38a6cd6) | Olympus 官方 | 团队、投资者、顾问的 pOHM 权益如何随供应增长行权；“公平发行”并不等于没有私募利益 |
| 2021-03-16 | [The Game (Theory) of Olympus](https://olympusdao.medium.com/the-game-theory-of-olympus-e4c5f19a77df) | Olympus 官方 | stake / bond / sell 的 3×3 矩阵与 `(3,3)` 来源 |
| 2021-04-24 | [First Month in Review](https://olympusdao.medium.com/first-month-in-review-e415191d680a) | Olympus 官方复盘 | 上线时间、首月 bonds、POL、staking、APY 与国库增长的官方描述 |
| 2021-04-29 | [官方 Twitter thread 归档](https://threadreaderapp.com/thread/1387579780044836866) | 官方同期数据归档 | 约 3,300 持有人、6,000 Discord、约 90% 供应质押、RFV 与协议拥有 LP 比例 |
| 2021-07-29 | [Bankless：WTF is Olympus DAO??](https://www.bankless.com/es/wtf-is-olympus-dao) | 外部教育媒体 | 将 bonding、staking、POL 和 reserve currency 翻译给更广泛 DeFi 用户 |
| 2021-08 | [OIP-18 Reward Rate Framework](https://forum.olympusdao.finance/d/77-oip-18-reward-rate-framework-and-reduction) | Olympus 正式治理讨论 | 团队开始按供应阶段降低奖励率，暴露稀释、runway、bond 效率和获客钩子之间的矛盾 |
| 2021-09-17 | [Introducing Olympus Pro](https://olympusdao.medium.com/introducing-olympus-pro-d8db3052fca5) | Olympus 官方发布 | Olympus Pro 产品、3.3% fee、marketplace exposure、co-marketing 与伙伴分发主张 |
| 2021-10-20 | [Bankless：Zeus 访谈文字稿](https://podscripts.co/podcasts/bankless/the-secret-weapon-of-defi-20-zeus-from-olympus-dao) | 外部访谈记录 | 创始人如何把 POL、Olympus Pro 与 DeFi 2.0 组织成统一叙事 |
| 2021-11—12 | [OIP-63 Reward Rate Adjustment](https://forum.olympusdao.finance/d/755-oip-63-reward-rate-adjustment) | Olympus 治理讨论 | 收入下降、奖励率调整，以及“供应增长必须匹配协议增长”的内部判断 |

## 机制、合约与安全

| 来源 | 性质 | 核心信息 |
|---|---|---|
| [V1 经济公式（GitHub）](https://github.com/OlympusDAO/olympus-docs/blob/main/docs/contracts-old/equations.md) | 官方源代码文档 | rebase、bond pricing、OHM 供应增长、staker / bonder / DAO / pOHM 发行、backing 与 LP RFV 公式；供应无硬上限 |
| [Olympus V1 合约仓库](https://github.com/OlympusDAO/olympus-contracts) | 官方代码 | V1 token、staking、bonding、treasury 等合约实现入口 |
| [OHM V1 合约](https://etherscan.io/address/0x383518188C0C6d7730D91b2c03a03C837814a899) | 链上合约 | 已部署 token 合约、交易和事件，可脱离宣传材料核对 |
| [sOHM 合约](https://etherscan.io/token/0x04f2694c8fcee23e8fd0dfea1d4f5bb8c352111f) | 链上合约 | `rebase`、`LogRebase`、`LogSupply` 等接口和历史事件 |
| [Legacy Staking](https://docs.olympusdao.finance/main/legacy/staking) | 官方机制文档 | OHM→sOHM、rebase 与 index 的工作方式 |
| [Legacy Bonding](https://docs.olympusdao.finance/main/legacy/bonding) | 官方机制文档 | 用户交付资产、获得折价 OHM、线性归属与协议获得储备的流程 |
| [Protocol-Owned Liquidity](https://docs.olympusdao.finance/main/overview/pol) | 官方概念文档 | POL 与传统流动性挖矿的区别；现行文档只用于解释概念，不作为 2021 年表现数据 |
| [PeckShield 2021-04 审计](https://files.safe.de.fi/safe/files/audit/pdf/PeckShield_Audit_Report_OlympusDAO_v1_0_1.pdf) | 第三方安全审计 | 0 critical、0 high、2 medium、2 low；确认 privileged owner 可更换 vault、铸造 OHM 或替换 staking 合约的早期权限风险 |
| [OIP-23：关键合约审计](https://forum.olympusdao.finance/d/94-oip-23-audit-for-critical-contracts) | Olympus 治理讨论 | Olympus Pro 与 wsOHM 等关键合约继续审计的需求；审计提升信任但不保证无风险 |
| [Binance Research：Tokenomics Deep Dive](https://research.binance.com/static/pdf/Tokenomics_Deep_Dive_Stefan_Piech_Shivam_Sharma.pdf) | 独立机构研究 | sOHM 可解除质押；高 APY主要是发行与持有人之间的价值转移，不会自动创造外部价值 |
| [EU Blockchain Observatory DeFi Report](https://www.standict.eu/sites/default/files/2022-06/DeFi%20Report%20EUBOF%20-%20Final_0.pdf) | 公共机构行业报告 | 把 Olympus 作为 POL 代表案例，证明机制的行业影响，不证明 OHM 价格可持续 |
| [Pathway to the DeFi of Cryptocurrency](https://arxiv.org/abs/2202.06541) | 学术论文 | POL 与定价机制的研究框架，作为行业机制影响旁证 |

## 增长与市场数据

| 时间/指标 | 来源 | 读法与限制 |
|---|---|---|
| 2021-04-29：约 3,300 持有人、6,000 Discord | [官方 Twitter thread 归档](https://threadreaderapp.com/thread/1387579780044836866) | 官方自报，但持有人等链上指标可进一步核对 |
| 2021-07-26：7,712 OHM/sOHM 持有人、16k Twitter、11k Discord | [Aave OHM ARC](https://governance.aave.com/t/arc-add-support-for-ohm/4955) | 由 Olympus 合作团队在申请中披露，适合作为同期中点快照 |
| 2021-09 中旬不足 15,000 持有人；11-23 约 75,000 | [The Defiant：Olympus Under Fire](https://thedefiant.io/news/defi/olympus-under-fire) | 媒体引用 Dune；同文给出约 43.6 亿美元市值峰值和后续清算数据 |
| 2021-10 每周 Ohmies 与国库增长 | [Agora Dispatch 2021-10-27](https://olympusagora.medium.com/the-agora-dispatch-olympus-community-weekly-newsletter-wednesday-27-october-2021-504c7e156039) | 社区运营媒体的同期快照，用于还原用户当时看到的增长信号 |
| 2021-11—12 市值、供应、质押率、backing、APY | [Keone Hon 财务机制分析](https://keonehd.medium.com/elucidating-the-financial-mechanics-of-olympusdao-eebab7a1502b) | 独立技术分析使用当时 Dashboard 快照；显示质押率仍高但价格、市值和 backing 已转弱 |
| 2021-09—2022-01 staking TVL | [DeFiLlama Olympus API](https://api.llama.fi/protocol/olympus-dao) | 9-17 约 8.81 亿美元、12-22 约 52.61 亿峰值、2022-01-17 约 24.25 亿；受价格和 rebase 供应影响，不等于国库或净流入 |
| OHM 单位价格历史 | [CoinGecko Olympus](https://www.coingecko.com/en/coins/olympus) | rebase 资产不能只看单位价格，需同时看供应、市值、持有人与 backing |

### 需要排除的异常数据

[美国参议院听证材料](https://www.congress.gov/117/chrg/CHRG-117shrg51128/CHRG-117shrg51128.pdf)收录一个标注 2021-12-13 的 439,043% APY 截图；但 [OIP-63 讨论第 2 页](https://forum.olympusdao.finance/d/755-oip-63-reward-rate-adjustment?page=2)同期记录 V2 迁移前端在约 400k 与约 4k 间异常跳动。该截图只用于证明超高 APY 表达进入监管讨论，不进入标准历史 APY 序列。

## Marketing、社区与 FOMO

| 来源 | 性质 | 可以了解什么 |
|---|---|---|
| [首次 FOHMO 公告](https://olympusdao.medium.com/fohmo-an-olympusdao-ceremony-april-23-2021-6pm-est-7a7d3491569e) | Olympus 官方 | 新人介绍、首月回顾、产品路线、行业嘉宾和社区致谢如何组合为仪式 |
| [FOHMO 3 日程](https://www.reddit.com/r/olympusdao/comments/pubnx5) | 同期社区公告 | Olympus Pro alpha、panel、游戏、音乐、NFT、空投、Poker 与 afterparty |
| [FOHMO 3 Discord/Twitch 与 Giveaway](https://www.reddit.com/r/olympusdao/comments/pu7z8j) | 同期社区公告 | 多渠道直播、Ledger giveaway 与 Discord 参与要求 |
| [FOHMO 3 后 DAO 招募](https://www.reddit.com/r/olympusdao/comments/pwfey6) | 同期社区公告 | 活动如何直接承接贡献者招募 |
| [OLY 101 / Sherpa Academy](https://www.reddit.com/r/olympusdao/comments/psre23) | 同期社区教育 | 新用户理解 staking、bonding、APY 与 game theory 的入口 |
| [2021-09-18 社区 DD](https://www.reddit.com/r/olympusdao/comments/pqmq10) | 用户内容样本 | 小时/每日回报、“什么都不用做”、自动 rebase、diamond hands、活动与社区贡献等零售传播钩子 |
| [Agora Dispatch 2021-10-27](https://olympusagora.medium.com/the-agora-dispatch-olympus-community-weekly-newsletter-wednesday-27-october-2021-504c7e156039) | 社区运营媒体 | 把治理、伙伴、数据、教育、诈骗提醒、成员故事、Meme 和贡献机会放在同一期 |
| [Agora Dispatch 2021-11-10](https://olympusagora.medium.com/the-agora-dispatch-olympus-community-weekly-newsletter-wednesday-10-november-2021-dd7f653d829a) | 社区运营媒体 | FOMO 高峰期的产品、伙伴与社区内容节奏 |
| [CoinDesk：Future of Money or Ponzi?](https://www.coindesk.com/policy/2021/12/05/olympus-dao-might-be-the-future-of-money-or-it-might-be-a-ponzi) | 同期外部媒体 | 2021 年 12 月争议已经成为主流注意力的一部分；负面讨论也扩大认知 |
| [Binance Research 2022 H1](https://research.binance.com/static/pdf/Binance-Research-Half-Year-Report-22.pdf) | 机构回顾 | 市值下跌、`(3,3)` 社交符号退潮，以及 token 需要 staking 之外效用的判断 |

社区帖子只能证明“当时有人如何理解和传播”，不能代表所有用户，也不能证明渠道转化率。

## Olympus Pro 与外部协议

| 来源 | 性质 | 核心信息 |
|---|---|---|
| [Introducing Olympus Pro](https://olympusdao.medium.com/introducing-olympus-pro-d8db3052fca5) | Olympus 官方 | bonding as a service、3.3% fee、marketplace exposure 与 co-marketing |
| [Cohort 2](https://olympusdao.medium.com/olympus-pro-introducing-cohort-2-launch-partners-6b64dbe2b18c) | Olympus 官方 | Synapse、Thorstarter、PoolTogether、Inverse、BarnBridge；首批伙伴获取约 750 万美元流动性 |
| [Fantom Cohort 1](https://olympusdao.medium.com/olympus-pro-introducing-fantom-cohort-1-launch-partners-b4ff40f78538) | Olympus 官方 | 跨链扩张与主题化伙伴发布 |
| [NFT / Metaverse Cohort](https://olympusdao.medium.com/olympus-pro-introducing-the-non-fungible-thanksgiving-cohort-e1ad29d2aa23) | Olympus 官方 | 从 DeFi 扩展到 NFT / metaverse 受众 |
| [Avalanche Cohort 1](https://olympusdao.medium.com/olympus-pro-introducing-avalanche-cohort-1-8ea3c75621f0) | Olympus 官方 | Avalanche 伙伴与累计 bonded liquidity 数据 |
| [Olympus Pro in 2022](https://olympusdao.medium.com/olympus-pro-in-2022-c21c4fedb2cc) | Olympus 官方复盘 | 4 个月约 40 伙伴、4 条链、4,500 万美元流动性、200 万美元收入；同时承认 onboarding 和内容不足 |
| [OIP-104：拆分为 Bond Protocol](https://forum.olympusdao.finance/d/1243-oip-104-deploy-permissionless-op-as-bond-protocol) | Olympus 正式治理 | 回顾 50+ 协议、7 链、近 1.5 亿美元资产；也记录收入有限、支出超过收入和使命分化 |
| [OIP-53：与 FRAX DAO swap](https://forum.olympusdao.finance/d/506-oip-53-execute-dao-swap-with-frax-finance) | Olympus 正式治理 | 有真实资产交换和储备关系的 partnership 案例，不只是 Logo 宣传 |
| [Aave OHM ARC](https://governance.aave.com/t/arc-add-support-for-ohm/4955) | Aave 治理讨论 | OHM 进入头部协议议程；社区要求 exposure cap、独立风险参数并质疑资产过新 |
| [Maker OHM 绿灯投票](https://vote.makerdao.com/polling/QmUVQdj5?network=mainnet) | Maker 正式投票 | Yes 46.22%、No 53.76%、Abstain 0.02%，未获绿灯 |
| [Maker 2021-11 治理月报](https://hackmd.io/@GovComms/Hyds3_-_K) | Maker 官方治理记录 | 对投票结果与 prioritization score 的独立官方记录 |

## 可持续性、下跌与清算

| 来源 | 性质 | 核心信息 |
|---|---|---|
| [V1 经济公式](https://github.com/OlympusDAO/olympus-docs/blob/main/docs/contracts-old/equations.md) | 官方代码文档 | 新发行来自 staker、bonder、DAO 与 pOHM；供应没有硬上限 |
| [OIP-43：Launch CVX Bonds](https://forum.olympusdao.finance/d/325-oip-43-launch-cvx-bonds) | Olympus 治理 | 提案直接承认协议高度依赖 bond demand 产生收入，并寻求非 bond 收入 |
| [OIP-63](https://forum.olympusdao.finance/d/755-oip-63-reward-rate-adjustment) | Olympus 治理 | 记录收入下降、奖励率调整与供应增长/协议增长错配风险 |
| [Keone Hon 财务机制分析](https://keonehd.medium.com/elucidating-the-financial-mechanics-of-olympusdao-eebab7a1502b) | 独立技术分析 | 高质押率和高 APY 未阻止单位价格、市值与 backing per OHM 同时下降 |
| [Norswap：Olympus Economics](https://norswap.com/olympus-econ/) | 独立经济分析 | 溢价、国库、发行和参与者收益关系；属于个人模型，不代替链上事实 |
| [The Defiant：Olympus Under Fire](https://thedefiant.io/news/defi/olympus-under-fire) | 同期媒体复盘 | 持有人、市值、溢价、forks、`(9,9)` 杠杆与约 1.5 亿美元 OHM 清算叙事 |
| [CoinDesk 2022-01-11](https://www.coindesk.com/markets/2022/01/11/olympus-tanks-30-led-by-liquidations-on-fuse-souring-market-sentiment) | 同期市场报道 | OHM 下跌、Fuse 清算和市场情绪 |
| [The Block 2022-01-18](https://www.theblock.co/news/defi/2022-01-18-olympusdaos-slide-continues-ohm-down-90-from-all-time-high-130597) | 同期市场报道 | 市值下跌、质押率从约 91.5% 至 85%、巨额卖出和清算；特别修正用市值而不是只用单位价格 |
| [Decrypt：Profit Taking and Liquidations](https://decrypt.co/90524/olympusdao-ohm-token-tanks-profit-taking-liquidations?amp=1) | 同期市场报道 | 获利了结、鲸鱼卖出与清算的交叉验证 |
| [82,526.7 OHM→11,368,224 DAI](https://etherscan.io/tx/0x8f45cc66eba60229085440505c84e063366b4e3d71fd98c1121018a7978e1978) | 链上交易 | 2022-01-17 巨额卖出的直接证据；应使用当时收到的 DAI，不使用 Etherscan 今天显示的 OHM 现值 |
| [余额增加但组合价值下降](https://www.reddit.com/r/olympusdao/comments/rby3m3) | 用户体验样本 | 用户开始直接感受到 rebase 数量增长不能抵消价格下降 |
| [2022-01 可持续性质疑](https://www.reddit.com/r/olympusdao/comments/s5lo31) | 社区情绪样本 | 下跌期用户如何讨论 APY、backing 与退出风险 |

## 使用边界

- Olympus 官方文章主要用来确认团队当时怎么设计、怎么宣传和披露数据；不能单独证明效果。
- 合约、链上交易和正式投票用于确认规则与发生的事件；它们不能直接解释用户动机。
- 机构研究和媒体用于交叉验证与提供外部判断；观点仍需和原始事实分开。
- 社区内容用于还原用户语言、FOMO 钩子和困惑，不作为总体用户统计。
- 后续新资料直接加入相应分组；如果它改变判断，同时更新[OHM 核心结论](../insights/2026-09-01-ohm-core-conclusions.md)和[主题主页](../topics/2026-09-01-olympus-ohm-cold-start-fomo-reversal.md)。
