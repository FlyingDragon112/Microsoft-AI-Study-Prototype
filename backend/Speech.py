import os
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()
api_endpoint = os.getenv("SPEECH_ENDPOINT")
api_key = os.getenv("SPEECH_KEY")
speech_config = speechsdk.SpeechConfig(subscription=api_key, endpoint=api_endpoint)

def recognize_from_microphone():
    auto_detect_source_language_config = speechsdk.languageconfig.AutoDetectSourceLanguageConfig(
        languages=[
            "en-US",  # English
            "hi-IN",  # Hindi
            "bn-IN",  # Bengali
            "gu-IN",  # Gujarati
        ]
    )
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    speech_recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config,
        auto_detect_source_language_config=auto_detect_source_language_config,
        audio_config=audio_config
    )

    print("Speak into your microphone.")
    result = speech_recognizer.recognize_once()
    auto_detect_source_language_result = speechsdk.AutoDetectSourceLanguageResult(result)
    detected_language = auto_detect_source_language_result.language

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print(f"Recognized: {result.text} (Language: {detected_language})")
        return result.text
    elif result.reason == speechsdk.ResultReason.NoMatch:
        print("No speech could be recognized: {}".format(result.no_match_details))
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = result.cancellation_details
        print("Speech Recognition canceled: {}".format(cancellation_details.reason))
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            print("Error details: {}".format(cancellation_details.error_details))
            print("Did you set the speech resource key and endpoint values?")
    return ""

def convert_text_to_speech(text, language):
    print(f"Converting text to speech in language: {language}")  # Debugging log
    audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
    voices = {
        "en-US": "en-US-AvaNeural",
        "hi-IN": "hi-IN-SwaraNeural",
        "bn-IN": "bn-IN-TanishaaNeural",
        "gu-IN": "gu-IN-DhwaniNeural"
    }
    speech_config.speech_synthesis_voice_name = voices.get(language, "hi-IN-SwaraNeural")

    speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
    speech_synthesis_result = speech_synthesizer.speak_text_async(text).get()

    if speech_synthesis_result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print(f"Speech synthesized for text [{text}] in language [{language}]")
    elif speech_synthesis_result.reason == speechsdk.ResultReason.Canceled:
        cancellation_details = speech_synthesis_result.cancellation_details
        print("Speech synthesis canceled: {}".format(cancellation_details.reason))
        if cancellation_details.reason == speechsdk.CancellationReason.Error:
            if cancellation_details.error_details:
                print("Error details: {}".format(cancellation_details.error_details))
                print("Did you set the speech resource key and endpoint values?")