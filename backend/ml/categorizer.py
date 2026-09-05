"""
MONVEX Machine Learning Categorizer Engine
Implements TF-IDF vectorization with Multinomial Naive Bayes classification.
"""
import re
from ml.training_data import TRAINING_DATA

try:
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.pipeline import Pipeline
    SKLEARN_AVAILABLE = True
except (ImportError, Exception):
    SKLEARN_AVAILABLE = False
    np = None

class FinancialCategorizer:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FinancialCategorizer, cls).__new__(cls)
            cls._instance._initialize_model()
        return cls._instance

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Lowercase, remove special characters and extra spaces
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _initialize_model(self):
        """Train baseline model from seed data or setup fallback"""
        self.texts = [self._clean_text(item[0]) for item in TRAINING_DATA]
        self.labels = [item[1] for item in TRAINING_DATA]
        self.pipeline = None
        self.use_sklearn = False

        if SKLEARN_AVAILABLE:
            try:
                self.pipeline = Pipeline([
                    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
                    ('clf', MultinomialNB(alpha=0.1)),
                ])
                self.pipeline.fit(self.texts, self.labels)
                self.use_sklearn = True
            except Exception:
                self.use_sklearn = False

    def predict(self, text: str, merchant_name: str = "") -> dict:
        """
        Predict financial category with confidence score.
        Returns:
            {
                "category": str,
                "confidence": float,
                "confidence_level": "HIGH" | "MEDIUM" | "LOW",
                "auto_applied": bool
            }
        """
        combined = f"{merchant_name} {text}".strip()
        cleaned = self._clean_text(combined)

        if not cleaned:
            return {
                "category": "Other Expense",
                "confidence": 0.0,
                "confidence_level": "LOW",
                "auto_applied": False
            }

        if getattr(self, 'use_sklearn', False) and self.pipeline is not None:
            probs = self.pipeline.predict_proba([cleaned])[0]
            max_idx = np.argmax(probs)
            category = self.pipeline.classes_[max_idx]
            confidence = float(probs[max_idx])
        else:
            tokens = set(cleaned.split())
            best_cat = "Other Expense"
            best_score = 0.0

            for t_text, t_label in zip(self.texts, self.labels):
                t_tokens = set(t_text.split())
                overlap = len(tokens & t_tokens)
                if overlap > 0:
                    score = overlap / max(len(tokens), 1)
                    if score > best_score:
                        best_score = score
                        best_cat = t_label

            category = best_cat
            confidence = min(round(best_score * 0.9, 4), 0.92) if best_score > 0 else 0.45

        # Confidence logic based on Master Blueprint:
        # > 0.85: Auto-applied
        # 0.50 - 0.85: Suggested
        # < 0.50: Prompt user
        if confidence >= 0.85:
            level = "HIGH"
            auto_applied = True
        elif confidence >= 0.50:
            level = "MEDIUM"
            auto_applied = False
        else:
            level = "LOW"
            auto_applied = False

        return {
            "category": category,
            "confidence": round(confidence, 4),
            "confidence_level": level,
            "auto_applied": auto_applied
        }

    def train_incremental(self, text: str, category: str):
        """Add user feedback to training dataset and retrain"""
        cleaned = self._clean_text(text)
        if cleaned and category:
            self.texts.append(cleaned)
            self.labels.append(category)
            if getattr(self, 'use_sklearn', False) and self.pipeline is not None:
                self.pipeline.fit(self.texts, self.labels)

# Global singleton
categorizer = FinancialCategorizer()
