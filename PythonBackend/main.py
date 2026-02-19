from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from phonetics import get_phonetics
from tts import text_to_speech
from audio_processing import save_base64_audio
from whisper_alignment import transcribe_audio
from mfcc_comparison import compare_mfccs
import os
import base64
import librosa
import librosa.display
import numpy as np
import matplotlib.pyplot as plt
import io


app = FastAPI()

# Disable CORS (Allow all origins, methods, and headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

class AudioInput(BaseModel):
    sentence: str
    user_audio: str  # Base64 encoded audio

def decode_base64_audio(audio_base64: str):
    """Removes Base64 header and decodes the audio data."""
    header, encoded_audio = audio_base64.split(",", 1) if "," in audio_base64 else ("", audio_base64)
    return base64.b64decode(encoded_audio)

def add_base64_prefix(audio_bytes: bytes, format: str = "wav"):
    """Encodes audio bytes to Base64 and adds appropriate prefix."""
    base64_audio = base64.b64encode(audio_bytes).decode()
    prefix = f"data:audio/{format};base64,"
    return prefix + base64_audio

def generate_mfcc_image(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    
    fig, ax = plt.subplots(figsize=(6, 4))
    img = librosa.display.specshow(mfccs, x_axis="time", cmap="coolwarm", ax=ax)
    ax.set_title("MFCC")
    plt.colorbar(img, ax=ax)

    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    
    return base64.b64encode(buf.getvalue()).decode("utf-8")

@app.post("/analyze")
async def analyze_pronunciation(data: AudioInput):
    correct_sentence = data.sentence
    user_audio_b64 = data.user_audio

    # Generate correct phonetics
    correct_phonetics = get_phonetics(correct_sentence)

    # Convert sentence to reference audio
    ref_audio_path = text_to_speech(correct_sentence)

    # Save user's audio from Base64
    user_audio_path = save_base64_audio(user_audio_b64)

    # Get user's phonetic transcription using Whisper
    user_transcription, user_phonetics = transcribe_audio(user_audio_path)

    # Compare MFCCs for mispronunciations
    word_accuracy, mispronounced_details, letter_analysis = compare_mfccs(ref_audio_path, user_audio_path, correct_sentence, user_transcription)

    # Read user and reference audio as bytes
    with open(user_audio_path, "rb") as user_file:
        user_audio_bytes = user_file.read()
    
    with open(ref_audio_path, "rb") as ref_file:
        ref_audio_bytes = ref_file.read()

    # Convert audio bytes to Base64
    user_audio_b64 = add_base64_prefix(user_audio_bytes, "wav")
    ref_audio_b64 = add_base64_prefix(ref_audio_bytes, "wav")

    user_mfcc_base64 = generate_mfcc_image("temp/user_audio.wav")
    ref_mfcc_base64 = generate_mfcc_image("temp/ref_audio.wav")


    # Clean up temp files
    os.remove(ref_audio_path)
    os.remove(user_audio_path)

    return {
        "correct_sentence": correct_sentence,
        "correct_phonetics": correct_phonetics,
        "user_transcription": user_transcription,
        "user_phonetics": user_phonetics,
        "letter_analysis": letter_analysis,
        "word_accuracy": word_accuracy,
        "mispronounced_details": mispronounced_details,
        "user_audio": user_audio_b64,   # Return user audio clip
        "reference_audio": ref_audio_b64, # Return reference audio clip
        "user_mfcc": user_mfcc_base64,
        "reference_mfcc": ref_mfcc_base64
    }

# Run server with:
# uvicorn main:app --reload
