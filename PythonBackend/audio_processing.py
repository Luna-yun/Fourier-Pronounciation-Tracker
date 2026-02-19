import base64
import uuid
import os

def save_base64_audio(base64_string):
    """Decodes a base64-encoded audio string and saves it to a file."""
    try:
        # Ensure the "temp" directory exists
        os.makedirs("temp", exist_ok=True)

        # Remove data URL prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]  # Keep only the base64 part

        # Fix padding issue
        missing_padding = len(base64_string) % 4
        if missing_padding:
            base64_string += "=" * (4 - missing_padding)

        # Decode Base64
        audio_data = base64.b64decode(base64_string)

        # Generate unique filename
        # file_path = f"temp/{uuid.uuid4()}.wav"
        file_path = f"temp/user_audio.wav"

        # Write to file
        with open(file_path, "wb") as f:
            f.write(audio_data)

        return file_path
    except Exception as e:
        print(f"Error decoding Base64 audio: {e}")
        raise e
