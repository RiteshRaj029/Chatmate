import whisper

model = whisper.load_model("base")
result = model.transcribe("chunk021.wav")
print(result["text"])