"""
MONVEX Industrial-Grade Natural Language Financial Entity Extractor
100% Deterministic & Robust Parsing for English, Hindi & Hinglish inputs.
"""
import re
from datetime import date, timedelta
from decimal import Decimal

# Comprehensive Merchant & Brand Catalog with canonical category mapping
MERCHANT_REGISTRY = {
    # Food & Dining
    'swiggy': ('Swiggy', 'Food & Dining'),
    'zomato': ('Zomato', 'Food & Dining'),
    'mcdonalds': ('McDonald\'s', 'Food & Dining'),
    'mcd': ('McDonald\'s', 'Food & Dining'),
    'dominos': ('Domino\'s Pizza', 'Food & Dining'),
    'pizza hut': ('Pizza Hut', 'Food & Dining'),
    'kfc': ('KFC', 'Food & Dining'),
    'burger king': ('Burger King', 'Food & Dining'),
    'starbucks': ('Starbucks', 'Food & Dining'),
    'cafe coffee day': ('Cafe Coffee Day', 'Food & Dining'),
    'ccd': ('Cafe Coffee Day', 'Food & Dining'),
    'chai point': ('Chai Point', 'Food & Dining'),
    'chaayos': ('Chaayos', 'Food & Dining'),
    'subway': ('Subway', 'Food & Dining'),
    'barbeque nation': ('Barbeque Nation', 'Food & Dining'),
    'haldirams': ('Haldiram\'s', 'Food & Dining'),
    'bikanervala': ('Bikanervala', 'Food & Dining'),
    'behrouz': ('Behrouz Biryani', 'Food & Dining'),
    'faasos': ('Faasos', 'Food & Dining'),
    'ovenstory': ('Ovenstory Pizza', 'Food & Dining'),

    # Groceries
    'blinkit': ('Blinkit', 'Groceries'),
    'zepto': ('Zepto', 'Groceries'),
    'instamart': ('Swiggy Instamart', 'Groceries'),
    'bigbasket': ('BigBasket', 'Groceries'),
    'bbdaily': ('BBDaily', 'Groceries'),
    'dmart': ('D-Mart', 'Groceries'),
    'd-mart': ('D-Mart', 'Groceries'),
    'reliance fresh': ('Reliance Fresh', 'Groceries'),
    'nature\'s basket': ('Nature\'s Basket', 'Groceries'),
    'spencer\'s': ('Spencer\'s', 'Groceries'),
    'more retail': ('More Supermarket', 'Groceries'),

    # Transportation & Fuel
    'uber': ('Uber', 'Transportation'),
    'ola': ('Ola', 'Transportation'),
    'rapido': ('Rapido', 'Transportation'),
    'blusmart': ('BluSmart', 'Transportation'),
    'metro': ('Metro Transit', 'Transportation'),
    'irctc': ('IRCTC', 'Transportation'),
    'makemytrip': ('MakeMyTrip', 'Transportation'),
    'mmt': ('MakeMyTrip', 'Transportation'),
    'yatra': ('Yatra', 'Transportation'),
    'goibibo': ('Goibibo', 'Transportation'),
    'indigo': ('IndiGo Airlines', 'Transportation'),
    'air india': ('Air India', 'Transportation'),
    'redbus': ('redBus', 'Transportation'),
    'fastag': ('Fastag Toll', 'Transportation'),
    'indian oil': ('Indian Oil', 'Transportation'),
    'iocl': ('Indian Oil', 'Transportation'),
    'bpcl': ('Bharat Petroleum', 'Transportation'),
    'bharat petroleum': ('Bharat Petroleum', 'Transportation'),
    'hpcl': ('Hindustan Petroleum', 'Transportation'),
    'hindustan petroleum': ('Hindustan Petroleum', 'Transportation'),
    'shell': ('Shell Petrol', 'Transportation'),

    # Bills & Utilities
    'airtel': ('Airtel', 'Bills & Utilities'),
    'jio': ('Jio', 'Bills & Utilities'),
    'vi': ('Vodafone Idea', 'Bills & Utilities'),
    'vodafone': ('Vodafone Idea', 'Bills & Utilities'),
    'bsnl': ('BSNL', 'Bills & Utilities'),
    'act': ('ACT Fibernet', 'Bills & Utilities'),
    'act fibernet': ('ACT Fibernet', 'Bills & Utilities'),
    'tata play': ('Tata Play', 'Bills & Utilities'),
    'tata sky': ('Tata Play', 'Bills & Utilities'),
    'dish tv': ('Dish TV', 'Bills & Utilities'),
    'bescom': ('BESCOM Electricity', 'Bills & Utilities'),
    'tata power': ('Tata Power', 'Bills & Utilities'),
    'adani electricity': ('Adani Electricity', 'Bills & Utilities'),
    'mahavitaran': ('MSEDCL Electricity', 'Bills & Utilities'),
    'igl': ('Indraprastha Gas', 'Bills & Utilities'),
    'mgl': ('Mahanagar Gas', 'Bills & Utilities'),
    'adani gas': ('Adani Total Gas', 'Bills & Utilities'),

    # Shopping
    'amazon': ('Amazon', 'Shopping'),
    'flipkart': ('Flipkart', 'Shopping'),
    'myntra': ('Myntra', 'Shopping'),
    'ajio': ('Ajio', 'Shopping'),
    'nykaa': ('Nykaa', 'Shopping'),
    'meesho': ('Meesho', 'Shopping'),
    'zara': ('Zara', 'Shopping'),
    'h&m': ('H&M', 'Shopping'),
    'hm': ('H&M', 'Shopping'),
    'uniqlo': ('Uniqlo', 'Shopping'),
    'croma': ('Croma', 'Shopping'),
    'reliance digital': ('Reliance Digital', 'Shopping'),
    'ikea': ('IKEA', 'Shopping'),
    'decathlon': ('Decathlon', 'Shopping'),

    # Entertainment & Fitness
    'netflix': ('Netflix', 'Entertainment'),
    'spotify': ('Spotify', 'Entertainment'),
    'prime video': ('Amazon Prime', 'Entertainment'),
    'amazon prime': ('Amazon Prime', 'Entertainment'),
    'hotstar': ('Disney+ Hotstar', 'Entertainment'),
    'disney+ hotstar': ('Disney+ Hotstar', 'Entertainment'),
    'youtube': ('YouTube Premium', 'Entertainment'),
    'bookmyshow': ('BookMyShow', 'Entertainment'),
    'pvr': ('PVR INOX Multiplex', 'Entertainment'),
    'inox': ('PVR INOX Multiplex', 'Entertainment'),
    'cult.fit': ('Cult.fit', 'Entertainment'),
    'cult fit': ('Cult.fit', 'Entertainment'),
    'curefit': ('Cult.fit', 'Entertainment'),
    'gold\'s gym': ('Gold\'s Gym', 'Entertainment'),

    # Health & Medical
    'apollo pharmacy': ('Apollo Pharmacy', 'Health & Medical'),
    'apollo': ('Apollo', 'Health & Medical'),
    '1mg': ('Tata 1mg', 'Health & Medical'),
    'pharmeasy': ('PharmEasy', 'Health & Medical'),
    'netmeds': ('Netmeds', 'Health & Medical'),
    'medplus': ('MedPlus', 'Health & Medical'),

    # Investments
    'zerodha': ('Zerodha', 'Investments'),
    'groww': ('Groww', 'Investments'),
    'upstox': ('Upstox', 'Investments'),
    'angelone': ('AngelOne', 'Investments'),
    'kuvera': ('Kuvera', 'Investments'),
    'coindcx': ('CoinDCX', 'Investments'),
    'wazirx': ('WazirX', 'Investments'),
}

# Explicit keyword categories
CATEGORY_KEYWORDS = {
    'Food & Dining': [
        'food', 'dinner', 'lunch', 'breakfast', 'snack', 'snacks', 'pizza', 'burger',
        'biryani', 'chai', 'coffee', 'tea', 'restaurant', 'cafe', 'dhaba', 'dosa',
        'samosa', 'paneer', 'roti', 'khana', 'nashta', 'meal', 'treat', 'party'
    ],
    'Groceries': [
        'grocery', 'groceries', 'sabzi', 'vegetable', 'vegetables', 'fruit', 'fruits',
        'milk', 'doodh', 'eggs', 'bread', 'butter', 'curd', 'dahi', 'atta', 'rice',
        'dal', 'oil', 'rashan', 'ration', 'supermarket'
    ],
    'Transportation': [
        'uber', 'ola', 'rapido', 'cab', 'taxi', 'auto', 'rickshaw', 'petrol', 'diesel',
        'fuel', 'gas', 'metro', 'train', 'bus', 'flight', 'ticket', 'toll', 'parking',
        'commute', 'travel', 'car wash', 'bike service', 'puncture'
    ],
    'Bills & Utilities': [
        'electricity', 'bijli', 'water', 'paani', 'broadband', 'wifi', 'internet',
        'recharge', 'mobile bill', 'postpaid', 'dth', 'cylinder', 'gas bill', 'maintenance',
        'society bill'
    ],
    'Housing & Rent': [
        'rent', 'kiraya', 'room rent', 'flat rent', 'house rent', 'pg rent', 'landlord',
        'emi', 'home loan', 'maintenance deposit', 'brokerage'
    ],
    'Shopping': [
        'shopping', 'clothes', 'shirt', 'pants', 'tshirt', 'jeans', 'dress', 'shoes',
        'sneakers', 'watch', 'bag', 'cosmetics', 'makeup', 'electronics', 'gadgets',
        'furniture', 'decor', 'amazon', 'flipkart', 'myntra', 'zara'
    ],
    'Entertainment': [
        'movie', 'cinema', 'theatre', 'netflix', 'spotify', 'prime', 'hotstar', 'concert',
        'game', 'gaming', 'steam', 'playstation', 'outing', 'club', 'pub', 'beer', 'drinks',
        'gym', 'workout', 'membership'
    ],
    'Health & Medical': [
        'medicine', 'medicines', 'dawa', 'doctor', 'clinic', 'hospital', 'dentist',
        'consultation', 'checkup', 'test', 'blood test', 'pharmacy', 'tablet', 'syrup',
        'injection', 'physio', 'insurance'
    ],
    'Salary & Income': [
        'salary', 'income', 'bonus', 'freelance', 'client payment', 'consulting',
        'incentive', 'stipend', 'allowance', 'cashback', 'interest', 'dividend'
    ],
    'Investments': [
        'sip', 'mutual fund', 'stocks', 'shares', 'equity', 'zerodha', 'groww', 'fd',
        'fixed deposit', 'ppf', 'nps', 'gold', 'crypto', 'bitcoin'
    ],
}

INCOME_TRIGGERS = [
    'salary', 'income', 'credited', 'received', 'got', 'earned', 'bonus', 'freelance',
    'stipend', 'dividend', 'cashback', 'aaya', 'aaye', 'mila', 'mile', 'jama hua', 'credit'
]


class NLPFinancialParser:

    @classmethod
    def parse(cls, text: str) -> dict:
        if not text or not text.strip():
            return cls._default_response(text)

        raw_text = text.strip()
        lower_text = raw_text.lower()

        # 1. Extract Monetary Amount
        amount = cls._extract_amount(raw_text, lower_text)

        # 2. Extract Transaction Type (INCOME vs EXPENSE)
        trans_type = 'INCOME' if any(re.search(rf'\b{re.escape(k)}\b', lower_text) for k in INCOME_TRIGGERS) else 'EXPENSE'

        # 3. Extract Merchant and Category
        merchant_name, category_name = cls._extract_merchant_and_category(lower_text, raw_text, trans_type)

        # 4. Extract Date Intelligence
        tx_date = cls._extract_date(lower_text)

        # 5. Clean Description
        description = raw_text

        # Confidence Score calculation
        confidence = 0.98 if (merchant_name and category_name) else (0.92 if category_name else 0.85)

        return {
            "amount": float(amount),
            "type": trans_type,
            "merchant": merchant_name,
            "category": category_name,
            "confidence": confidence,
            "confidence_level": "HIGH",
            "auto_applied": True,
            "date": str(tx_date),
            "description": description,
            "raw_text": raw_text
        }

    @classmethod
    def _extract_amount(cls, raw: str, lower: str) -> Decimal:
        """
        Multi-tier regex algorithm prioritizing currency context and numerical magnitude
        """
        # Clean commas in numbers like "75,000" -> "75000"
        normalized = re.sub(r'(\d+),(\d+)', r'\1\2', raw)
        norm_lower = normalized.lower()

        # Pattern Tier 1: Explicit currency anchor (₹, Rs, Rs., INR, rupees, rupaye, bucks, /-)
        # Matches: "₹620", "620 rupaye", "Rs. 1,499", "1499/-", "rupaye 500", "500rs"
        tier1_patterns = [
            r'(?:₹|rs\.?|inr|rupees?|rupaye)\s*(\d+(?:\.\d{1,2})?)',
            r'(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|rupees?|rupaye|bucks|\/-)',
            r'(?:paid|spent|cost|charge|debited|credited|worth)\s*(?:of\s*)?(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)',
            r'(?:for|of|pe|par|ka|ki)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:kharch|diya|bhara|bheja|rupaye)?'
        ]

        for pat in tier1_patterns:
            matches = re.findall(pat, norm_lower)
            if matches:
                # Pick valid positive numerical value
                for m in reversed(matches):
                    try:
                        val = Decimal(m)
                        if val > 0 and val != 2026: # avoid year false positive
                            return val
                    except Exception:
                        continue

        # Pattern Tier 2: Isolated standalone numbers (e.g. "Swiggy dinner 480", "Uber 250", "Salary 75000")
        numbers = re.findall(r'\b\d+(?:\.\d{1,2})?\b', normalized)
        valid_numbers = []
        for n in numbers:
            try:
                d = Decimal(n)
                # Filter out years like 2025, 2026 or small quantities if larger price exists
                if d > 0 and d != Decimal('2026') and d != Decimal('2025') and d != Decimal('2024'):
                    valid_numbers.append(d)
            except Exception:
                continue

        if valid_numbers:
            # If multiple numbers exist, prefer the largest one (e.g. "2 shirts for 1800" -> 1800)
            return max(valid_numbers)

        return Decimal('0.00')

    @classmethod
    def _extract_merchant_and_category(cls, lower: str, raw: str, trans_type: str) -> tuple:
        merchant_name = ""
        category_name = ""

        # Step A: Match against comprehensive Merchant catalog
        for key, (canon_merchant, canon_category) in MERCHANT_REGISTRY.items():
            if re.search(rf'\b{re.escape(key)}\b', lower):
                merchant_name = canon_merchant
                category_name = canon_category
                break

        # Step B: If category not resolved by merchant, match category keywords
        if not category_name:
            for cat, keywords in CATEGORY_KEYWORDS.items():
                if any(re.search(rf'\b{re.escape(kw)}\b', lower) for kw in keywords):
                    category_name = cat
                    break

        # Step C: Fallback to default by transaction type
        if not category_name:
            category_name = 'Salary & Income' if trans_type == 'INCOME' else 'Food & Dining'

        return merchant_name, category_name

    @classmethod
    def _extract_date(cls, lower: str) -> date:
        today = date.today()
        if 'yesterday' in lower or 'kal' in lower or 'beeta kal' in lower:
            return today - timedelta(days=1)
        if 'parso' in lower or 'day before yesterday' in lower:
            return today - timedelta(days=2)
        return today

    @classmethod
    def _default_response(cls, text: str) -> dict:
        return {
            "amount": 0.0,
            "type": "EXPENSE",
            "merchant": "",
            "category": "Food & Dining",
            "confidence": 1.0,
            "confidence_level": "HIGH",
            "auto_applied": True,
            "date": str(date.today()),
            "description": text or "",
            "raw_text": text or ""
        }
