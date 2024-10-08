from flask import Blueprint, request, jsonify, render_template, redirect, url_for, session, Response
from flask_login import login_required, current_user
from werkzeug.exceptions import Unauthorized
from extensions import db
from models.chat_history import ChatHistory
from models.openai_client import client_creator
from io import BytesIO
import base64
from PIL import Image
import pyttsx3
import uuid
import os
import logging
import ffmpeg



bp = Blueprint('chat', __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

@bp.route('/', methods=['GET'])
@login_required
def chat():
    user = current_user
    return render_template('index.html',user=user)

@bp.route('/api/send_message', methods = ['POST'])
@login_required
def send_message():
    data = request.get_json()
    message = data.get('message')
    model_params = data.get('model_params',{})
    audio_response = data.get('audio_response')
    image_base64 = data.get('image')
    

    if not message:
        return jsonify({'error': 'Message is required'}), 400
    
    client = client_creator()
    response_message = ""

    # Prepare the message content
    messages = [{"role": "user", "content": [{"type": "text", "text": message}]}]

    # If an image is included, add it to the messages content
    if image_base64:
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{image_base64}",
                "detail": "high"
            }
        })    
    def generate():
        try:
            


            response = client.chat.completions.create(
                model= model_params.get("model"),
                messages = messages,
                temperature=model_params.get("temperature",0.5),
                max_tokens=4096,
                stream=True,
            )

            for chunk in response:
                try:
                    if chunk.choices[0].delta.content is not None:
                        yield (chunk.choices[0].delta.content)
                        
                        # content = chunk.choices[0].delta.content
                        # if content:
                        #     response_message += content
                        # yield response_message
                except IndexError as e:
                    logging.error(f"Chunk processing error: {str(e)}")

            # Prepare the response
            # response_data = {
            #     'response': response_message,
            #     'audio': None
            # }       

            # chat_history = ChatHistory(user_id = current_user.id, message = message, response = response_message)
            # db.session.add(chat_history)
            # db.session.commit()


            # if audio_response:
            #     engine = pyttsx3.init()
            #     unique_audio_file = f'response_audio_{uuid.uuid4()}.mp3'
            #     engine.save_to_file(response_message, unique_audio_file)
            #     engine.runAndWait()
            #     with open(unique_audio_file,'rb') as audio_file:
            #         audio_bytes = audio_file.read()
            #     response_data['audio'] = base64.b64encode(audio_bytes).decode('utf-8')
            #     os.remove(unique_audio_file)

            # return jsonify(response_data)
        
        except Exception as e:
            logging.error(f"Error in send_message: {str(e)}")
            return jsonify({'error': 'Internal Server Error'}), 500   

    return generate(), {"Content-Type": "text/plain"}         

@bp.route('/api/add_image', methods = ['POST'])
@login_required
def add_image():
    #image upload and processing to be done
    if 'image' not in request.files:
        return jsonify({'status': 'No image uploaded'}), 400
    
    image_file = request.files['image']
    if image_file:
        raw_img = Image.open(image_file)
        buffered = BytesIO()
        raw_img.save(buffered, format = raw_img.format)
        img_byte = buffered.getvalue()
        img_base64 = base64.b64encode(img_byte).decode('utf-8')

        # chat_history = ChatHistory(user_id = current_user.id, message="", response = "", image = img_base64)
        # db.session.add(chat_history)
        # db.session.commit()
        return jsonify({'status': 'Image received', 'image': img_base64})

    return jsonify({'status': 'Image processing failed'}), 500


@bp.route('/api/transcribe_audio', methods=['POST'])
@login_required
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400

    audio_file = request.files['audio']
    print(f"printing the audio file........{audio_file}")
    if audio_file:
        
        print(audio_file.filename)
        file_extension = audio_file.filename.split('.')[-1].lower()
        print(f"this is the extension {file_extension}")
        supported_formats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']
        
        if file_extension not in supported_formats:
            return jsonify({'error': f'Unsupported file format: {file_extension}. Supported formats: {supported_formats}'}), 400
        
        
        with open('recording.mp3', 'wb') as audio:
            audio_file.save(audio)
        print('file uploaded successfully')
        
        
        output_path = "testing.wav"
        ffmpeg.input("recording.mp3").output(output_path, acodec='pcm_s16le', ar=16000).run(overwrite_output=True)
        
        # audiofile_path = audio_file.read()
        # audio_file_like = BytesIO(r"C:\Hosting Projects\Chatmate\recording.wav")  # Convert bytes to file-like object
        with open(r"C:\Hosting Projects\Chatmate\testing.wav", "rb") as f:
            # audio_file_like = BytesIO(f.read())  # Convert bytes to file-like object
            
            
            # audio_file_like = BytesIO(f.read())

            client = client_creator()
            # Use Whisper model to transcribe audio
            print("The code was called here!")
            transcription = client.audio.transcriptions.create(
                model="whisper",
                file= f,
                language='en'
            )
            return jsonify({'transcription': transcription.text})
    

    return jsonify({'error': 'Audio processing failed'}), 500


@bp.errorhandler(Unauthorized)
def unauthorized_handler(e):
    return redirect(url_for('auth.login'))
