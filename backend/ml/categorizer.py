"""
MONVEX Machine Learning Categorizer Engine
Implements TF-IDF vectorization with Multinomial Naive Bayes classification.
"""
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from ml.training_data import TRAINING_DATA

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
        """Train baseline model from seed data"""
        self.texts = [self._clean_text(item[0]) for item in TRAINING_DATA]
        self.labels = [item[1] for item in TRAINING_DATA]

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
            ('clf', MultinomialNB(alpha=0.1)),
        ])

        self.pipeline.fit(self.texts, self.labels)

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

        probs = self.pipeline.predict_proba([cleaned])[0]
        max_idx = np.argmax(probs)
        category = self.pipeline.classes_[max_idx]
        confidence = float(probs[max_idx])

        # Confidence logic based on Master Blueprint:
        # > 0.90: Auto-applied
        # 0.60 - 0.90: Suggested
        # < 0.60: Prompt user
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
            self.pipeline.fit(self.texts, self.labels)

# Global singleton
categorizer = FinancialCategorizer()
