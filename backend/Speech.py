import os
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv
import requests, uuid

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

def translate_text_azure(text, to_language):
    constructed_url = 'https://api.cognitive.microsofttranslator.com/translate'

    params = {
        'api-version': '3.0',
        'from': 'en',
        'to': to_language
    }

    headers = {
        'Ocp-Apim-Subscription-Key': os.getenv("TRANSLATE_KEY"),
        'Ocp-Apim-Subscription-Region': "southeastasia",
        'Content-type': 'application/json',
        'X-ClientTraceId': str(uuid.uuid4())
    }
    body = [{'text': text}]
    response = requests.post(constructed_url, params=params, headers=headers, json=body)
    response.raise_for_status()
    translations = response.json()
    if translations and 'translations' in translations[0]:
        return translations[0]['translations'][0]['text']
    return text  # fallback

def convert_text_to_speech(text, language):
    print(f"Converting text to speech in language: {language}")  # Debugging log
    audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
    voices = {
        "en-US": "en-US-AvaNeural",
        "hi-IN": "hi-IN-SwaraNeural",
        "bn-IN": "bn-IN-TanishaaNeural",
        "gu-IN": "gu-IN-DhwaniNeural"
    }
    # Translate if not English
    if language != "en-US":
        # Set your Azure Translator credentials
        translator_key = os.getenv("TRANSLATOR_KEY")
        translator_endpoint = os.getenv("TRANSLATOR_ENDPOINT")  # e.g., "https://api.cognitive.microsofttranslator.com/"
        region = os.getenv("TRANSLATOR_REGION")  # e.g., "centralindia"
        # Map language code to Azure Translator code
        lang_map = {"hi-IN": "hi", "bn-IN": "bn", "gu-IN": "gu"}
        to_lang = lang_map.get(language, "hi")
        text = translate_text_azure(text, to_lang)
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
