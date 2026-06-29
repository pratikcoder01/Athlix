import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

def train_kata_classifier(
    input_csv: str = "features.csv",
    model_output_dir: str = "models"
):
    os.makedirs(model_output_dir, exist_ok=True)
    
    # Load dataset
    print(f"📥 Loading dataset from {input_csv}")
    df = pd.read_csv(input_csv)
    
    # Split into X (features) and y (labels)
    X = df.drop("label", axis=1).values
    y = df["label"].values
    
    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"🎯 Classes: {list(le.classes_)}")
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Create multiple strong learners
    xgb = XGBClassifier(
        n_estimators=1000,
        max_depth=12,
        learning_rate=0.05,
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=42
    )
    
    rf = RandomForestClassifier(
        n_estimators=1000,
        max_depth=20,
        n_jobs=-1,
        random_state=42
    )
    
    knn = KNeighborsClassifier(n_neighbors=7, weights="distance", n_jobs=-1)
    
    mlp = MLPClassifier(
        hidden_layer_sizes=(512, 256, 128),
        max_iter=1000,
        early_stopping=True,
        random_state=42
    )
    
    # Ensemble voting classifier
    model = VotingClassifier(
        estimators=[("xgb", xgb), ("rf", rf), ("knn", knn), ("mlp", mlp)],
        voting="soft"
    )
    
    print("\n🚀 Training Ensemble Classifier...")
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    print("\n📊 Evaluating Model...")
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"✅ Test Accuracy: {accuracy:.4f}")
    print("\n📝 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    # Cross validation
    cv_scores = cross_val_score(model, scaler.transform(X), y_encoded, cv=5)
    print(f"\n🔄 Cross-Validation Scores: {cv_scores.round(4)}")
    print(f"📈 Mean CV Accuracy: {np.mean(cv_scores):.4f} (±{np.std(cv_scores):.4f})")
    
    # Save models
    joblib.dump(model, os.path.join(model_output_dir, "kata_classifier.pkl"))
    joblib.dump(le, os.path.join(model_output_dir, "label_encoder.pkl"))
    joblib.dump(scaler, os.path.join(model_output_dir, "scaler.pkl"))
    
    print(f"\n💾 Models saved to {model_output_dir}/")
    
    # Plot confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
               xticklabels=le.classes_, yticklabels=le.classes_)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix")
    plt.savefig(os.path.join(model_output_dir, "confusion_matrix.png"), dpi=150, bbox_inches="tight")
    print("\n📊 Confusion matrix saved!")

if __name__ == "__main__":
    import os
    import sys
    input_csv = sys.argv[1] if len(sys.argv) > 1 else "features.csv"
    model_output_dir = sys.argv[2] if len(sys.argv) > 2 else "models"
    train_kata_classifier(input_csv, model_output_dir)
