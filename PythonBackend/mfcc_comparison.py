import librosa
import numpy as np
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean
from phonetics import get_phonetics
from difflib import SequenceMatcher

def extract_mfcc(audio_path, sr=16000):
    """Extracts MFCCs from an entire audio file."""
    y, sr = librosa.load(audio_path, sr=sr)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    return mfccs.T  # Shape: (frames, n_mfcc)

def segment_audio(audio_path, words):
    """(TODO: Implement) Segments an audio file into per-word MFCCs."""
    return {word: extract_mfcc(audio_path) for word in words}  # Placeholder

def find_best_match(word, user_words):
    """Finds the best phonetic match for a given word in user_words."""
    best_match = None
    highest_similarity = 0

    correct_phonetics = get_phonetics(word)

    for user_word in user_words:
        user_phonetics = get_phonetics(user_word)
        similarity = SequenceMatcher(None, correct_phonetics, user_phonetics).ratio()

        if similarity > highest_similarity:
            highest_similarity = similarity
            best_match = user_word

    return best_match, highest_similarity

def compare_mfccs(ref_audio, user_audio, correct_sentence, user_transcription):
    """Compares MFCCs using DTW and provides detailed word & letter-level analysis."""
    
    correct_words = correct_sentence.lower().split()
    user_words = user_transcription.lower().split()

    mispronounced_details = {}
    total_distance = 0
    letter_analysis = {}

    incorrect_words = 0  # Count both missing and mispronounced words
    total_words = len(correct_words)

    for word in correct_words:
        word_status = "correct"
        letter_status = {char: "correct" for char in word}

        # Find the best matching word in user's transcription
        best_match, similarity = find_best_match(word, user_words)

        if best_match is None or similarity < 0.5:  # Threshold for phonetic similarity
            # If no match is found, mark it as missing
            word_status = "missing"
            letter_status = {char: "miss" for char in word}
            incorrect_words += 1  # Increase incorrect count
            letter_analysis[word] = {
                "status": word_status,
                "letters": letter_status
            }
            continue  # Skip MFCC comparison

        # Process the matched word
        correct_phonetics = get_phonetics(word)
        user_phonetics = get_phonetics(best_match)

        if correct_phonetics != user_phonetics:
            # Extract MFCCs only if phonetics differ
            ref_mfcc = segment_audio(ref_audio, [word])[word]
            user_mfcc = segment_audio(user_audio, [best_match])[best_match]
            
            word_dist, _ = fastdtw(ref_mfcc, user_mfcc, dist=euclidean)
            total_distance += word_dist  

            phonetic_similarity = SequenceMatcher(None, correct_phonetics, user_phonetics).ratio()
            threshold = np.mean(ref_mfcc) * (2 - phonetic_similarity)  # Adjust threshold
            
            if word_dist > threshold:
                word_status = "mispronounced"
                mispronounced_details[word] = f"Mispronounced (DTW: {word_dist:.2f})"
                incorrect_words += 1  # Increase incorrect count
            
            # Identify specific letter mismatches based on phonetics
            for i, char in enumerate(word):
                if i >= len(best_match) or get_phonetics(char) != get_phonetics(best_match[i]):
                    letter_status[char] = "mispronounced"

        letter_analysis[word] = {
            "status": word_status,
            "letters": letter_status
        }

    # Calculate word accuracy
    correct_words_count = total_words - incorrect_words
    word_accuracy = round(max(0, 100 * (correct_words_count / total_words))) if total_words > 0 else 0

    print(f"Total distance: {total_distance:.2f}")
    print(mispronounced_details)
    print(letter_analysis)
    print(f"Word Accuracy: {word_accuracy:.2f}%")

    return word_accuracy, mispronounced_details, letter_analysis
