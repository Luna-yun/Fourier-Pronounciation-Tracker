# Fourier-Pronunciation-Tracker

**Fourier-Pronunciation-Tracker** is an AI-powered tool designed to analyze and track pronunciation using Fourier transforms. By converting audio signals into frequency components, it helps users visualize, evaluate, and improve their speech and pronunciation.

## 🚀 Features
- Analyze pronunciation using audio frequency data
- Visualize speech patterns with Fourier transforms
- Track improvements over time
- User-friendly interface for real-time feedback

## 🧠 Technologies Used
- Python
- NumPy and SciPy for Fourier analysis
- Matplotlib / Plotly for visualization
- Optional: TensorFlow / PyTorch for AI-based pronunciation evaluation

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Fourier-Pronunciation-Tracker.git
cd Fourier-Pronunciation-Tracker

##Install dependencies:
pip install -r requirements.txt

##Track pronunciation from an audio file:
python track_audio.py --file path/to/audio.wav

##Real-time pronunciation tracking via microphone:
python track_microphone.py

##Visualize frequency components:
python visualize.py --file path/to/audio.wav

For Backend, 
1.first install libraries with command 'pip install -r requirements.txt'
2.then, run the project with command 'uvicorn main:app --reload'

For Frontend,
1.Download Node.js and install it.
2.While running the backend server, install frontend dependencies in frontend folder with command 'npm i' or 'npm i --legacy-peer-deps'
3.Run the frontend with command 'npm run dev'

Enjoy your testing pronunciation!
