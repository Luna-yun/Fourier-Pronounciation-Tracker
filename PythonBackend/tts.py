from gtts import gTTS
import os

def text_to_speech(text):
    """Converts text to speech using Google TTS and saves it as a WAV file."""
    tts = gTTS(text=text, lang='en')
    filename = "temp/ref_audio.wav"
    os.makedirs("temp", exist_ok=True)
    
    # Save the file
    tts.save(filename)
    
    return filename

