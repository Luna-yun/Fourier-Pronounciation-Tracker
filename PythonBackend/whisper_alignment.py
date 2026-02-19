import whisper
from phonetics import get_phonetics

# Load Whisper model (use 'large' for better accuracy)
model = whisper.load_model("small")

def transcribe_audio(audio_path):
    """Transcribes audio using Whisper and converts text to phonetics."""
    result = model.transcribe(audio_path, language="en", temperature=0)  # More consistent output
    user_text = result["text"].strip()

    # Convert to phonetics (CMUdict)
    user_phonetics = get_phonetics(user_text) if user_text else "No transcription"

    return user_text, user_phonetics
