from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI
from io import BytesIO
from models.openai_client import client_creator



with open(r"C:\Hosting Projects\Chatmate\testing.wav", "rb") as f:
    # audio_file_like = BytesIO(f.read())


    client = client_creator()
    # Use Whisper model to transcribe audio
    transcription = client.audio.transcriptions.create(
        model="whisper",
        file= f,
        language='en'
    )

    print(transcription.text)