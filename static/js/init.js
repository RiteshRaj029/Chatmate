document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const modelSelect = document.getElementById('model-select');
    const audioResponseCheckbox = document.getElementById('audio-response-checkbox');
    const chatContainer = document.getElementById('chat-container');
    const uploadBtn = document.getElementById('upload-btn');
    const imageUpload = document.getElementById('image-upload');
    const audioBtn = document.getElementById('audio-btn');

    let mediaRecorder;
    let audioChunks = [];

    audioBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            audioBtn.textContent = 'Press to talk 🎙️';
        } else {
            startRecording();
            audioBtn.textContent = 'Stop recording ⏹️';
        }
    });

    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.wav');

                for (const [key, value] of formData.entries()) {
                    console.log(`${key}:`, value);
                }
                

                try {
                    const response = await fetch('/api/transcribe_audio', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    if (response.ok) {
                        displayMessage(data.transcription, 'user');
                    } else {
                        alert(data.error || 'An error occurred during transcription');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while transcribing the audio');
                }
            });
        }).catch(error => {
            console.error('Error accessing media devices.', error);
            alert('Could not access microphone. Please check your settings.');
        });
    }

    sendBtn.addEventListener('click', async () => {
        const message = messageInput.value;
        if (!message) return;
        
        const modelParams = {
            model: modelSelect.value,
            temperature: 0.3
        };
        const audioResponse = audioResponseCheckbox.checked;

		try {
            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, model_params: modelParams, audio_response: audioResponse })
            });
            
            const data = await response.json();
            if (response.ok) {
                displayMessage(message, 'user');
                displayMessage(data.response, 'bot');

                if (data.audio) {
                    const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
                    audio.play();
                }

                messageInput.value = '';
            } else {
                alert(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while sending the message');
        }
    });



    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.textContent = message;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // uploadBtn.addEventListener('click', () => {
    //     imageUpload.click();
    // });

    // imageUpload.addEventListener('change', async () => {
    //     const file = imageUpload.files[0];
    //     if (!file) return;

    //     const formData = new FormData();
    //     formData.append('image', file);

    //     const response = await fetch('/api/add_image', {
    //         method: 'POST',
    //         body: formData
    //     });

    //     const data = await response.json();
    //     alert(data.status);
    // });
});





const menu = document.querySelector(".menu");

menu.addEventListener("click", function () {
	expandSidebar();
	showHover();
});

function expandSidebar() {
	document.querySelector("body").classList.toggle("short");
	let keepSidebar = document.querySelectorAll("body.short");
	if (keepSidebar.length === 1) {
		localStorage.setItem("keepSidebar", "true");
	} else {
		localStorage.removeItem("keepSidebar");
	}
}

function showHover() {
	const li = document.querySelectorAll(".short .sidebar li a");
	if (li.length > 0) {
		li.forEach(function (item) {
			item.addEventListener("mouseover", function () {
				const text = item.querySelector(".text");
				text.classList.add("hover");
			});
			item.addEventListener("mouseout", function () {
				const text = item.querySelector(".text");
				text.classList.remove("hover");
			});
		});
	}
}
