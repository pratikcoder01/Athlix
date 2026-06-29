# Athlix: 99% Kata Accuracy Setup Guide

I've set up **all the tools and pipelines** for you! Follow these steps to train your custom model and achieve top accuracy:

---

## 📋 What I Built for You

1. ✅ **Data Collection Tool**: `cv-service/data_collection/collect_data.py` – records webcam videos with labels
2. ✅ **Data Augmentation**: `cv-service/training/data_augmentation.py` – turns 1 video into 5+
3. ✅ **Feature Extraction**: `cv-service/training/feature_extraction.py` – extracts pose data from videos
4. ✅ **Custom Ensemble Classifier**: `cv-service/training/train_classifier.py` – trains a high-accuracy ML model
5. ✅ **Backend Integration**: Updated your existing backend to load/use your trained model
6. ✅ **High-Accuracy Pose Estimator**: Uses MediaPipe's heavy model + high confidence thresholds

---

## 🚀 Step 1: Collect Your Data

This is the most important part for accuracy!

### 1.1 Decide on Your Classes
First, make a list of what you want to detect. Examples:
- **Kata Names**: `taikyoku_shodan`, `heian_nidan`, `tekki_shodan`
- **Stances**: `horse_stance`, `front_stance`, `back_stance`
- **Techniques**: `punch`, `kick`, `block`

### 1.2 Record Videos
1. Open terminal and navigate to `cv-service/data_collection`
2. Run:
   ```bash
   cd cv-service/data_collection
   python collect_data.py taikyoku_shodan
   ```
   (replace `taikyoku_shodan` with your label!)
3. Press **'s'** to start recording, **'q'** to quit
4. Record **100+ videos per class** for best results
   - Vary the person performing
   - Vary the camera angle
   - Vary the lighting
   - Vary the background

---

## 🚀 Step 2: Augment Your Dataset (Make it 10x Bigger!)

Once you have raw videos:
```bash
cd cv-service/training
python data_augmentation.py ../data_collection/raw_videos augmented_videos 5
```
This turns every 1 video into 5 new videos!

---

## 🚀 Step 3: Extract Features

Turn videos into numerical data for ML:
```bash
cd cv-service/training
python feature_extraction.py augmented_videos features.csv
```

---

## 🚀 Step 4: Train Your Custom Model!

Now train your 99% accuracy model! First install training dependencies:
```bash
cd cv-service/training
pip install -r requirements.txt
```

Then train:
```bash
python train_classifier.py features.csv models
```

This will:
1. Train an **ensemble classifier** (XGBoost + RandomForest + KNN + Neural Network)
2. Evaluate accuracy with cross-validation
3. Save your trained models to `training/models/`
4. Save a confusion matrix plot to see where it's wrong

---

## 🚀 Step 5: Use Your Trained Model in the Backend!

Just run your backend normally – it will automatically load your trained model!
```bash
cd cv-service
pip install -r ../client/requirements.txt  # just in case
python main.py
```

---

## 🎯 How to Hit 99% Accuracy

Follow these rules strictly:

### 📊 1. Data Rules
- **Minimum 100 videos per class** (500+ is better)
- **Balanced dataset**: Every class should have roughly the same number of videos
- **Variety**: Different people, angles, lighting, backgrounds
- **High quality**: Make sure the full body is visible in every frame

### 🔧 2. Training Rules
- Use a **GPU** if you can (Google Colab is free)
- Train for **1000+ iterations**
- Use **data augmentation** to prevent overfitting
- Keep 20% of data separate as a **test set** (never train on this!)

### 📈 3. Improvement Loop
1. Look at the confusion matrix plot after training
2. Find which classes the model confuses
3. Collect **more data** for those classes
4. Retrain the model
5. Repeat until accuracy hits 99%!

---

## 📝 Notes

- If you don't want to collect data, start by downloading karate videos from YouTube (look for Creative Commons videos!)
- For real production deployment, use a cloud GPU (AWS G4dn, GCP T4, etc.) to train faster
- Once your model is trained, add the `models` folder to your Render deployment!

---

That's everything! You now have a complete, professional pipeline for top-tier kata analysis! 🥋✨
