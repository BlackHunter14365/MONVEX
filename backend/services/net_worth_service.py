"""
MONVEX Net Worth & Balance Sheet Engine
Computes Total Assets, Total Liabilities, Net Worth, and Solvency Metrics.
"""
from decimal import Decimal
from django.db.models import Sum
from django.contrib.auth.models import User
from apps.transactions.models import Asset, Liability, Transaction


class NetWorthService:

    @staticmethod
    def calculate_net_worth(user: User) -> dict:
        assets = Asset.objects.filter(user=user)
        liabilities = Liability.objects.filter(user=user)

        # 1. Assets Aggregation
        total_assets_val = sum((float(a.value) for a in assets), 0.0)

        # Add liquid cash from ledger transactions if user has no manual cash assets
        cash_tx = Transaction.objects.filter(user=user, type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        exp_tx = Transaction.objects.filter(user=user, type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        ledger_balance = float(cash_tx - exp_tx)

        if not assets.filter(asset_type='CASH').exists() and ledger_balance > 0:
            total_assets_val += ledger_balance

        # 2. Liabilities Aggregation
        total_liabilities_val = sum((float(l.remaining_balance) for l in liabilities), 0.0)

        # 3. Net Worth Calculation
        net_worth = total_assets_val - total_liabilities_val

        # 4. Asset Class Allocation
        asset_types = {}
        for a in assets:
            atype = a.asset_type
            asset_types[atype] = asset_types.get(atype, 0.0) + float(a.value)

        if not assets.filter(asset_type='CASH').exists() and ledger_balance > 0:
            asset_types['CASH'] = asset_types.get('CASH', 0.0) + ledger_balance

        asset_allocation = [
            {
                "type": k,
                "label": dict(Asset.ASSET_CHOICES).get(k, k),
                "total": round(v, 2),
                "percentage": round((v / max(1.0, total_assets_val)) * 100, 1)
            }
            for k, v in asset_types.items()
        ]

        # 5. Liability Class Allocation
        liab_types = {}
        for l in liabilities:
            ltype = l.liability_type
            liab_types[ltype] = liab_types.get(ltype, 0.0) + float(l.remaining_balance)

        liability_allocation = [
            {
                "type": k,
                "label": dict(Liability.LIABILITY_CHOICES).get(k, k),
                "total": round(v, 2),
                "percentage": round((v / max(1.0, total_liabilities_val)) * 100, 1)
            }
            for k, v in liab_types.items()
        ]

        # 6. Solvency Ratio
        debt_to_asset_ratio = round((total_liabilities_val / max(1.0, total_assets_val)) * 100, 1)

        return {
            "total_assets": round(total_assets_val, 2),
            "total_liabilities": round(total_liabilities_val, 2),
            "net_worth": round(net_worth, 2),
            "debt_to_asset_ratio": debt_to_asset_ratio,
            "solvency_status": "STRONG" if debt_to_asset_ratio < 30 else ("MODERATE" if debt_to_asset_ratio < 60 else "OVERLEVERAGED"),
            "asset_allocation": asset_allocation,
            "liability_allocation": liability_allocation,
            "assets_list": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "asset_type": a.asset_type,
                    "value": float(a.value),
                    "institution": a.institution
                }
                for a in assets
            ],
            "liabilities_list": [
                {
                    "id": str(l.id),
                    "name": l.name,
                    "liability_type": l.liability_type,
                    "remaining_balance": float(l.remaining_balance),
                    "monthly_emi": float(l.monthly_emi),
                    "interest_rate_pct": float(l.interest_rate_pct)
                }
                for l in liabilities
            ]
        }
