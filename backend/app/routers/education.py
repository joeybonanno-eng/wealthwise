from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/education", tags=["education"])

LESSONS = [
    {
        "slug": "diversification",
        "title": "Diversification: Don't Put All Your Eggs in One Basket",
        "description": "Learn why spreading your investments across different assets reduces risk.",
        "icon": "pie-chart",
        "difficulty": "beginner",
        "read_time": "5 min",
        "content": """## What Is Diversification?

Diversification is the practice of spreading your investments across different asset classes, sectors, and geographies to reduce overall portfolio risk.

### Why It Matters

When you concentrate your money in a single investment, you're exposed to **idiosyncratic risk** — the chance that one specific company or asset underperforms. Diversification helps smooth out these ups and downs.

### Key Principles

1. **Asset Class Diversification** — Mix stocks, bonds, real estate, and cash equivalents
2. **Sector Diversification** — Spread across technology, healthcare, finance, consumer goods, etc.
3. **Geographic Diversification** — Include domestic and international investments
4. **Time Diversification** — Invest regularly over time (dollar-cost averaging)

### The Math Behind It

Modern Portfolio Theory (MPT) shows that a diversified portfolio can achieve better risk-adjusted returns than any single investment. The key insight: assets that don't move in perfect correlation reduce overall volatility.

### How to Diversify

- **Index funds** provide instant diversification across hundreds of stocks
- **Target-date funds** automatically balance across asset classes
- **REITs** add real estate exposure without buying property
- **International ETFs** provide geographic diversification

### Common Mistakes

- Over-diversifying (holding too many overlapping funds)
- Thinking you're diversified when all your stocks are in one sector
- Ignoring correlation — two "different" investments may move together

> **Rule of thumb:** If losing any single investment would significantly impact your financial health, you're not diversified enough.
""",
    },
    {
        "slug": "dollar-cost-averaging",
        "title": "Dollar-Cost Averaging: Invest Consistently",
        "description": "Understand the power of investing a fixed amount at regular intervals.",
        "icon": "calendar",
        "difficulty": "beginner",
        "read_time": "4 min",
        "content": """## What Is Dollar-Cost Averaging (DCA)?

Dollar-cost averaging means investing a **fixed dollar amount** at **regular intervals**, regardless of market conditions. Instead of trying to time the market, you buy consistently.

### How It Works

| Month | Amount | Price | Shares Bought |
|-------|--------|-------|---------------|
| Jan   | $500   | $50   | 10            |
| Feb   | $500   | $40   | 12.5          |
| Mar   | $500   | $60   | 8.33          |
| **Total** | **$1,500** | **Avg: $48.39** | **30.83** |

By investing the same amount each time, you automatically buy **more shares when prices are low** and **fewer when prices are high**.

### Benefits

1. **Removes emotion** — No need to decide if "now" is the right time
2. **Reduces timing risk** — Avoids investing everything at a market peak
3. **Builds discipline** — Creates a consistent savings habit
4. **Accessible** — Start with any amount, even $25/month

### When DCA Shines

- In volatile or declining markets (you accumulate more shares cheaply)
- When you receive regular income (match investing to paychecks)
- When starting out with investing (removes analysis paralysis)

### Limitations

- In a consistently rising market, lump-sum investing may outperform
- DCA doesn't protect against long-term declining assets
- Transaction fees can eat into small regular purchases (use commission-free platforms)

> **Pro tip:** Set up automatic investments on payday. What you don't see, you don't miss.
""",
    },
    {
        "slug": "asset-allocation",
        "title": "Asset Allocation: Building Your Portfolio Mix",
        "description": "Learn how to balance stocks, bonds, and other assets based on your goals.",
        "icon": "layers",
        "difficulty": "intermediate",
        "read_time": "6 min",
        "content": """## What Is Asset Allocation?

Asset allocation is the strategy of dividing your investment portfolio among different asset categories — primarily **stocks**, **bonds**, and **cash equivalents**.

### Why It Matters

Studies show that asset allocation accounts for over **90% of portfolio return variability**. The mix of assets you hold matters more than which specific stocks you pick.

### Major Asset Classes

| Asset Class | Risk Level | Expected Return | Role in Portfolio |
|-------------|-----------|-----------------|-------------------|
| Stocks | High | 7-10% annually | Growth |
| Bonds | Low-Medium | 3-5% annually | Stability & Income |
| Cash | Very Low | 1-2% annually | Safety & Liquidity |
| Real Estate | Medium | 5-8% annually | Diversification & Income |

### Age-Based Rules of Thumb

- **Rule of 110:** Hold (110 minus your age)% in stocks. A 30-year-old would hold 80% stocks, 20% bonds.
- **Aggressive (20s-30s):** 80-90% stocks, 10-20% bonds
- **Moderate (40s-50s):** 60-70% stocks, 30-40% bonds
- **Conservative (60s+):** 40-50% stocks, 50-60% bonds

### Rebalancing

Over time, your allocation drifts as assets grow at different rates. **Rebalance annually** — sell winners and buy underperformers to return to your target mix.

### Key Takeaways

1. Match your allocation to your **time horizon** and **risk tolerance**
2. Younger investors can afford more risk (more stocks)
3. As you approach retirement, gradually shift toward bonds
4. Rebalance at least once a year
""",
    },
    {
        "slug": "emergency-fund",
        "title": "Emergency Fund: Your Financial Safety Net",
        "description": "Why every financial plan starts with saving 3-6 months of expenses.",
        "icon": "shield",
        "difficulty": "beginner",
        "read_time": "4 min",
        "content": """## What Is an Emergency Fund?

An emergency fund is a dedicated savings account holding **3-6 months of essential living expenses**, designed to cover unexpected financial shocks.

### Why You Need One

Life is unpredictable. Without an emergency fund, an unexpected event can force you into high-interest debt:

- **Job loss** — Average job search takes 3-6 months
- **Medical emergencies** — Even with insurance, deductibles add up
- **Car/home repairs** — A new transmission or roof can cost thousands
- **Family emergencies** — Unexpected travel or caregiving needs

### How Much to Save

| Situation | Recommended Amount |
|-----------|-------------------|
| Stable job, no dependents | 3 months of expenses |
| Variable income / freelance | 6 months of expenses |
| Single income household | 6 months of expenses |
| High-risk industry | 6-9 months of expenses |

### Where to Keep It

Your emergency fund should be:
- **Liquid** — accessible within 1-2 business days
- **Safe** — FDIC-insured savings or money market account
- **Separate** — in a different account from daily checking (reduces temptation)

### Building Your Fund

1. Calculate your monthly essential expenses
2. Set a target (3x or 6x that number)
3. Automate transfers — even $100/month adds up
4. Use windfalls (tax refunds, bonuses) to accelerate

### What Counts as an Emergency?

**Yes:** Job loss, medical bills, essential car repair, urgent home repair
**No:** Vacations, new gadgets, "great deals," planned expenses

> **Start today:** Even $1,000 covers most minor emergencies and reduces financial stress significantly.
""",
    },
    {
        "slug": "compound-interest",
        "title": "Compound Interest: The Eighth Wonder of the World",
        "description": "Discover how your money grows exponentially over time.",
        "icon": "trending-up",
        "difficulty": "beginner",
        "read_time": "5 min",
        "content": """## What Is Compound Interest?

Compound interest is **interest earned on interest**. Unlike simple interest (calculated only on the principal), compound interest grows your money exponentially.

### The Formula

**A = P(1 + r/n)^(nt)**

Where:
- A = final amount
- P = principal (starting amount)
- r = annual interest rate
- n = number of times compounded per year
- t = number of years

### The Power of Time

| Starting Amount | Monthly Addition | Years | 7% Return | Final Value |
|----------------|-----------------|-------|-----------|-------------|
| $10,000 | $500 | 10 | 7% | $106,000 |
| $10,000 | $500 | 20 | 7% | $272,000 |
| $10,000 | $500 | 30 | 7% | $612,000 |
| $10,000 | $500 | 40 | 7% | $1,320,000 |

Notice how the growth **accelerates** in later decades. That's compounding at work.

### The Rule of 72

Divide 72 by your annual return rate to estimate how many years it takes to **double** your money:
- At 7% return: 72 / 7 = ~10.3 years to double
- At 10% return: 72 / 10 = ~7.2 years to double

### Key Insights

1. **Start early** — Time is the most powerful factor
2. **Stay invested** — Pulling money out interrupts compounding
3. **Reinvest dividends** — Let returns generate more returns
4. **Minimize fees** — Even 1% in fees dramatically reduces long-term growth

### The Cost of Waiting

A 25-year-old investing $500/month for 40 years at 7% accumulates ~$1.3M.
A 35-year-old investing the same amount for 30 years accumulates ~$612K.
Those 10 extra years of compounding are worth over **$700,000**.

> **Bottom line:** The best time to start investing was yesterday. The second best time is today.
""",
    },
    {
        "slug": "tax-basics",
        "title": "Tax-Advantaged Investing: Keep More of Your Returns",
        "description": "Understand 401(k)s, IRAs, and strategies to minimize your tax burden.",
        "icon": "file-text",
        "difficulty": "intermediate",
        "read_time": "6 min",
        "content": """## Tax-Advantaged Accounts

The government incentivizes saving for retirement through tax-advantaged accounts. Using them effectively can save you hundreds of thousands over a lifetime.

### Account Types

| Account | Tax Benefit | 2024 Limit | Best For |
|---------|-----------|------------|----------|
| 401(k) | Pre-tax contributions, tax-deferred growth | $23,000 | Employer match |
| Traditional IRA | Tax-deductible contributions | $7,000 | No employer plan |
| Roth IRA | Tax-free growth & withdrawals | $7,000 | Lower tax bracket now |
| Roth 401(k) | Tax-free growth & withdrawals | $23,000 | Higher tax bracket in retirement |
| HSA | Triple tax advantage | $4,150 (individual) | Healthcare savings |

### Traditional vs. Roth

**Traditional (Pre-Tax):**
- Reduce taxable income today
- Pay taxes when you withdraw in retirement
- Best if you expect a lower tax bracket in retirement

**Roth (After-Tax):**
- No tax break today
- All growth and withdrawals are tax-free
- Best if you expect a higher tax bracket in retirement

### The Power of Tax-Free Growth

$10,000 invested for 30 years at 7%:
- **Taxable account** (25% rate): ~$44,000 after taxes
- **Tax-deferred (Traditional):** ~$76,000 (taxed on withdrawal)
- **Tax-free (Roth):** ~$76,000 (no tax on withdrawal)

### Key Strategies

1. **Always get the full employer match** — It's free money (typically 3-6% of salary)
2. **Max out Roth IRA** if eligible — Tax-free growth is incredibly powerful
3. **Use HSA as a stealth retirement account** — Triple tax advantage
4. **Consider tax-loss harvesting** — Offset gains with losses in taxable accounts
5. **Place tax-inefficient assets in tax-advantaged accounts** — Bonds and REITs generate taxable income

### Capital Gains Tax Rates

- **Short-term** (held < 1 year): Taxed as ordinary income
- **Long-term** (held > 1 year): 0%, 15%, or 20% depending on income

> **Pro tip:** Hold investments for at least one year to qualify for lower long-term capital gains rates.
""",
    },
    {
        "slug": "retirement-planning",
        "title": "Retirement Planning: Your Roadmap to Financial Freedom",
        "description": "Calculate how much you need and create a plan to get there.",
        "icon": "sunset",
        "difficulty": "intermediate",
        "read_time": "7 min",
        "content": """## Planning for Retirement

Retirement planning answers one crucial question: **How much do I need to save so I never have to work again?**

### The 4% Rule

The most widely used retirement guideline:
- In retirement, withdraw **4% of your portfolio** in the first year
- Adjust for inflation each subsequent year
- This strategy has historically sustained portfolios for 30+ years

### How Much Do You Need?

**Target = Annual Expenses x 25**

| Annual Expenses | Portfolio Needed |
|----------------|-----------------|
| $40,000 | $1,000,000 |
| $60,000 | $1,500,000 |
| $80,000 | $2,000,000 |
| $100,000 | $2,500,000 |

### Steps to Plan

1. **Estimate retirement expenses** — Most people need 70-80% of pre-retirement income
2. **Account for Social Security** — Check your estimate at ssa.gov
3. **Calculate the gap** — Total needed minus Social Security and pensions
4. **Determine savings rate** — Use your target and timeline to calculate monthly savings
5. **Invest appropriately** — Balance growth and risk based on your timeline

### Retirement Savings by Age (Benchmarks)

| Age | Savings Target |
|-----|---------------|
| 30 | 1x annual salary |
| 40 | 3x annual salary |
| 50 | 6x annual salary |
| 60 | 8x annual salary |
| 67 | 10x annual salary |

### Common Mistakes

- **Starting too late** — Compounding needs time to work
- **Being too conservative** — Inflation erodes purchasing power
- **Ignoring healthcare costs** — Major expense in retirement
- **Underestimating lifespan** — Plan for 30+ years of retirement
- **Not accounting for inflation** — $1M today won't buy the same in 30 years

### Social Security

- You can start collecting at age 62 (reduced benefit)
- Full benefit at age 67
- Delayed credits up to age 70 (increased benefit by ~8%/year)

> **Key insight:** Every dollar you save in your 20s is worth about $16 at retirement (assuming 7% returns over 40 years).
""",
    },
    {
        "slug": "risk-management",
        "title": "Risk Management: Protecting Your Financial Future",
        "description": "Learn to identify, assess, and manage different types of financial risk.",
        "icon": "alert-triangle",
        "difficulty": "intermediate",
        "read_time": "6 min",
        "content": """## Understanding Financial Risk

Every investment carries risk. The key isn't to avoid risk entirely — it's to **understand, measure, and manage** it effectively.

### Types of Investment Risk

| Risk Type | Description | Mitigation |
|-----------|------------|------------|
| Market Risk | Overall market decline | Diversification, long time horizon |
| Inflation Risk | Purchasing power erosion | Hold growth assets (stocks, TIPS) |
| Interest Rate Risk | Bond values fall when rates rise | Ladder bonds, keep short duration |
| Concentration Risk | Too much in one investment | Diversify across sectors/assets |
| Liquidity Risk | Can't sell when you need to | Keep emergency fund in cash |
| Sequence Risk | Bad returns early in retirement | Bond tent strategy, flexible spending |

### Risk Tolerance Assessment

Your risk tolerance depends on:
1. **Time horizon** — More time = more risk capacity
2. **Financial situation** — Stable income = more risk capacity
3. **Knowledge** — Understanding investments reduces perceived risk
4. **Emotional tolerance** — Can you sleep through a 30% drop?

### Risk vs. Return

Higher risk generally means higher potential returns:

- **Low risk:** Savings accounts, CDs, Treasury bills (1-3%)
- **Medium risk:** Investment-grade bonds, balanced funds (4-6%)
- **Higher risk:** Stock index funds, growth stocks (7-10%)
- **Highest risk:** Individual stocks, crypto, options (highly variable)

### Risk Management Strategies

1. **Diversification** — Don't put all eggs in one basket
2. **Asset allocation** — Match risk level to goals and timeline
3. **Rebalancing** — Maintain target allocation as markets move
4. **Emergency fund** — 3-6 months of expenses in cash
5. **Insurance** — Protect against catastrophic loss (health, life, disability)
6. **Stop-loss limits** — Know when to cut losses on individual investments

### The Risk of Not Investing

While investing carries risk, **not investing** carries its own risk:
- Inflation erodes cash at ~3% per year
- $100,000 in cash loses ~$26,000 in purchasing power over 10 years
- Missing out on compound growth is the biggest risk of all

> **Remember:** Risk is not the enemy — unmanaged risk is. The goal is to take on the right amount of risk for your situation and goals.
""",
    },
]


@router.get("/lessons")
def list_lessons():
    return [
        {
            "slug": l["slug"],
            "title": l["title"],
            "description": l["description"],
            "icon": l["icon"],
            "difficulty": l["difficulty"],
            "read_time": l["read_time"],
        }
        for l in LESSONS
    ]


@router.get("/lessons/{slug}")
def get_lesson(slug: str):
    for l in LESSONS:
        if l["slug"] == slug:
            return l
    raise HTTPException(status_code=404, detail="Lesson not found")
