"""DCF Valuation tool for fmp-mcp-server"""

def calculate_dcf(
    symbol: str,
    free_cash_flow: float,
    shares_outstanding: float,
    total_debt: float,
    cash_and_equivalents: float,
    growth_rate: float = 0.05,
    terminal_growth_rate: float = 0.025,
    discount_rate: float = 0.10,
    projection_years: int = 5,
) -> str:
    """
    Calculate intrinsic value using Discounted Cash Flow model.
    
    Projects future free cash flows, discounts them to present value,
    adds terminal value, and derives per-share intrinsic value.
    """
    # Project FCFs
    projected_fcf = []
    fcf = free_cash_flow
    for year in range(1, projection_years + 1):
        fcf = fcf * (1 + growth_rate)
        projected_fcf.append(fcf)
    
    # Discount factors
    discount_factors = [(1 / (1 + discount_rate) ** y) for y in range(1, projection_years + 1)]
    
    # PV of projected FCFs
    pv_fcfs = [fcf * df for fcf, df in zip(projected_fcf, discount_factors)]
    sum_pv_fcf = sum(pv_fcfs)
    
    # Terminal value (perpetuity growth)
    terminal_value = projected_fcf[-1] * (1 + terminal_growth_rate) / (discount_rate - terminal_growth_rate)
    pv_terminal = terminal_value * discount_factors[-1]
    
    # Enterprise → Equity → Per Share
    enterprise_value = sum_pv_fcf + pv_terminal
    equity_value = enterprise_value - total_debt + cash_and_equivalents
    intrinsic_price = equity_value / shares_outstanding
    
    # Terminal value as % of EV
    tv_pct = (pv_terminal / enterprise_value) * 100
    
    # Format output
    lines = [
        f"# DCF Valuation: {symbol}",
        f"## Assumptions",
        f"- Growth Rate: {growth_rate:.1%}",
        f"- Terminal Growth: {terminal_growth_rate:.1%}",
        f"- Discount Rate (WACC): {discount_rate:.1%}",
        f"- Projection Years: {projection_years}",
        f"",
        f"## Projected Free Cash Flows",
    ]
    for i, (fcf, df, pv) in enumerate(zip(projected_fcf, discount_factors, pv_fcfs)):
        lines.append(f"- Year {i+1}: FCF ${fcf:,.0f} × {df:.4f} = PV ${pv:,.0f}")
    
    lines += [
        f"",
        f"## Valuation",
        f"- Sum PV of FCFs: ${sum_pv_fcf:,.0f}",
        f"- Terminal Value: ${terminal_value:,.0f}",
        f"- PV of Terminal Value: ${pv_terminal:,.0f}",
        f"- ⚠️ Terminal Value is {tv_pct:.1f}% of EV" if tv_pct > 75 else f"- Terminal Value is {tv_pct:.1f}% of EV",
        f"- **Enterprise Value: ${enterprise_value:,.0f}**",
        f"- Less: Total Debt (${total_debt:,.0f})",
        f"- Plus: Cash (${cash_and_equivalents:,.0f})",
        f"- **Equity Value: ${equity_value:,.0f}**",
        f"- Shares Outstanding: {shares_outstanding:,.0f}",
        f"- **Implied Share Price: ${intrinsic_price:,.2f}**",
    ]
    
    return "\n".join(lines)
