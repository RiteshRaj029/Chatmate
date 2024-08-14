
document.addEventListener('DOMContentLoaded', function () {
    const chatContainer = document.getElementById('chat-container');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const modelSelect = document.getElementById('model-select');
    const audioResponseCheckbox = document.getElementById('audio-response-checkbox');
    const uploadBtn = document.getElementById('upload-btn');
    const imageUpload = document.getElementById('image-upload');
    const audioBtn = document.getElementById('audio-btn');
    const cameraBtn = document.getElementById('camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const videoContainer = document.getElementById('camera-container');
    const resetConversationBtn = document.getElementById('reset-conversation');

    document.getElementById('logout-icon').addEventListener('click', function() {
        window.location.href = '/logout';
    });

    let mediaRecorder;
    let audioChunks = [];
    let isCapturing = false;
    let videoElement;
    let videoStream;
    let cameraOpen = false;
    let isUploading = false;


    //add an audio(voice recording and handling)
    audioBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            audioBtn.textContent = 'Press to talk 🎙️';
        }
         else {
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
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.mp3');

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
                    const transcribedText = data.transcription;
                    displayMessage(transcribedText, 'user');
                    console.log(transcribedText)
                    

                    const modelParams = {
                        model: modelSelect.value,
                        temperature: 0.5
                    };
                    // const audioResponse = audioResponseCheckbox.checked;

                    const messageResponse = await fetch('/api/send_message', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message: transcribedText, model_params: modelParams })    //, audio_response: audioResponse
                    });

                

                    // const messageData = await messageResponse.json();
                    // if (messageResponse.ok) {
                        
                    //     displayMessage(messageData.response, 'bot');
                    //     console.log(messageData)
                    //     console.log(messageData.response)

                    //     // if (messageData.audio) {
                    //     //     const audio = new Audio(`data:audio/mp3;base64,${messageData.audio}`);
                    //     //     audio.play();
                    //     // }

                    //     messageInput.value = '';
                    // } else {
                    //     alert(messageData.error || 'An error occurred');
                    // }

                    const reader = messageResponse.body.getReader();
                    let output = "";
                    let messageElement = document.createElement('div');
                    messageElement.classList.add('message', 'bot');
                    chatContainer.appendChild(messageElement);

                    while(true){
                        const { done , value } = await reader.read();
                        output += new TextDecoder().decode(value);
                        messageElement.innerHTML = marked.parse(output);


                        if(done){
                            console.log(output)
                            return;
                        }
                        chatContainer.scrollTop = chatContainer.scrollHeight;
            }
                } 
                else {
                    alert(data.error || 'An error occurred during transcription');
                }
                } 
                catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while transcribing the audio');
                }
                
            });
        }).catch(error => {
            console.error('Error accessing media devices.', error);
            alert('Could not access microphone. Please check your settings.');
        });
    }
    function initializeCaptureButton() {
        captureBtn.removeEventListener('click', handleCapture);
        captureBtn.addEventListener('click', handleCapture);
    }
    async function handleCapture() {
        if (isCapturing) return;
        isCapturing = true;

        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/png');

            // Check if the captured image is not black
            const isBlack = await checkIfBlackImage(imageData);
            if (!isBlack) {
                const base64Image = imageData.split(',')[1];
                displayImage(base64Image, 'user'); // Display image
                sessionStorage.setItem('captured_image', base64Image); // Save to session storage
            } else {
                console.log('Captured a black image, not displaying.');
            }

            videoStream.getTracks().forEach(track => track.stop());
            videoElement.remove();
            captureBtn.style.display = 'none';
            cameraOpen = false;
        } else {
            alert('Video is not ready. Please make sure the camera is working properly.');
        }

        isCapturing = false; // Reset capturing flag
    }
    //clicking pic from camera
    // cameraBtn.addEventListener('click', function() {
    //     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    //         navigator.mediaDevices.getUserMedia({ video: true })
    //             .then(function(stream) {
    //                 videoElement = document.createElement('video');
    //                 videoElement.srcObject = stream;
    //                 videoElement.autoplay = true;
    //                 videoElement.style.width = '100%';
    //                 videoContainer.appendChild(videoElement);
    //                 videoStream = stream;
    //                 captureBtn.style.display = 'block';
   
    //                 captureBtn.addEventListener('click', function() {
    //                     const canvas = document.createElement('canvas');
    //                     const context = canvas.getContext('2d');
    //                     canvas.width = videoElement.videoWidth;
    //                     canvas.height = videoElement.videoHeight;
    //                     context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    //                     const imageData = canvas.toDataURL('image/png');
                       
    //                     // Store the captured image in sessionStorage
    //                     sessionStorage.setItem('captured_image', imageData.split(',')[1]);
                       
    //                     // Display the captured image in the chat UI
    //                     displayImage(imageData.split(',')[1], 'user');
    //                     // displayMessage('Image captured successfully', 'user');
                       
    //                     // Stop the video stream and remove the video element
    //                     videoStream.getTracks().forEach(track => track.stop());
    //                     videoElement.remove();
    //                     captureBtn.style.display = 'none';
    //                     cameraOpen = false;
    //                 });
    //             })
    //             .catch(function(error) {
    //                 console.error('Error accessing the camera: ', error);
    //                 alert('Could not access the camera. Please check your settings.');
    //             });
    //     } else {
    //         alert('getUserMedia is not supported in this browser.');
    //     }
        
    // });

    cameraBtn.addEventListener('click', function() {
        if (!cameraOpen) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    videoElement = document.createElement('video');
                    videoElement.srcObject = stream;
                    videoElement.autoplay = true;
                    videoElement.style.width = '100%';
                    videoContainer.appendChild(videoElement);
                    videoStream = stream;
                    captureBtn.style.display = 'block';
                    cameraOpen = true;
                    initializeCaptureButton(); // Initialize capture button
                })
                .catch(function(error) {
                    console.error('Error accessing the camera: ', error);
                    alert('Could not access the camera. Please check your settings.');
                });
        } else {
            videoStream.getTracks().forEach(track => track.stop());
            if (videoElement) {
                videoElement.remove();
            }
            captureBtn.style.display = 'none';
            cameraOpen = false; 
        }
    });
    
    function checkIfBlackImage(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageData;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

                for (let i = 0; i < pixelData.length; i += 4) {
                    if (pixelData[i] !== 0 || pixelData[i + 1] !== 0 || pixelData[i + 2] !== 0) {
                        resolve(false);
                        return;
                    }
                }
                resolve(true);
            };
        });
    }
    function displayImage(imageData, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);

        const imgElement = document.createElement('img');
        imgElement.src = `data:image/png;base64,${imageData}`;
        imgElement.alt = "Uploaded image";
        imgElement.style.maxWidth = "200px";  
        imgElement.style.maxHeight = "200px";

        messageElement.appendChild(imgElement);
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the latest message
    }

    resetConversationBtn.addEventListener('click', async () => {
    // Show confirmation dialog
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will reset the conversation and clear all messages.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, reset it!',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        // Clear all messages from the chat container
        chatContainer.innerHTML = '';

        // Optionally, clear any stored images
        sessionStorage.removeItem('uploaded_image');
        sessionStorage.removeItem('captured_image');

        // Optionally, clear any input fields
        messageInput.value = '';

        // Show success message
        Swal.fire(
            'Reset!',
            'The conversation has been reset.',
            'success'
        );
    }
});

    

    async function handleSendMessage() {
        
        const message = messageInput.value;
        if (!message) return;
        
        displayMessage(message, 'user');
        messageInput.value = '';

        const modelParams = {
            model: modelSelect.value,
            temperature: 0.3
        };
        // const audioResponse = audioResponseCheckbox.checked;
        const uploadedImage = sessionStorage.getItem('uploaded_image');
        const capturedImage = sessionStorage.getItem('captured_image');

		try {
            const payload = {
                message,
                model_params: modelParams,
                // audio_response: audioResponse,
                image: capturedImage || uploadedImage
            };
   
            console.log('Sending payload', payload);

            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            // const data = await response.json();
            // if (response.ok) {
                
            //     displayMessage(data.response, 'bot');

            //     if (data.audio) {
            //         const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            //         audio.play();
            //     }

                
            //     sessionStorage.removeItem('uploaded_image');
            //     sessionStorage.removeItem('captured_image');
            // } else {
            //     alert(data.error || 'An error occurred');
            // }

            const reader = response.body.getReader();
            // const decoder = new TextDecoder();
            let output = "";
            let messageElement = document.createElement('div');
            messageElement.classList.add('message', 'bot');
            chatContainer.appendChild(messageElement);

            while(true){
                const { done , value } = await reader.read();
                output += new TextDecoder().decode(value);
                messageElement.innerHTML = marked.parse(output);
               
                // chatContainer.innerHTML = marked.parse(output);


                if(done){
                    console.log(output)
                    return;
                }
                // output += decoder.decode(value, { stream: true });
                // Update the existing message element with new content
                // messageElement.textContent = marked.parse(output);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            
            }

            


        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while sending the message');
        }
    }

    //send button handling
    sendBtn.addEventListener('click', handleSendMessage);

    // Event listener for Enter key press
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevents the default action of Enter key (e.g., form submission)
            handleSendMessage();
        }
    });



    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);

        const textElement = document.createElement('p');
        textElement.textContent = message;
        messageElement.appendChild(textElement);
        // messageElement.textContent = message;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function displayImage(imageData, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
 
        const imgElement = document.createElement('img');
        imgElement.src = `data:image/png;base64,${imageData}`;
        imgElement.alt = "Uploaded image";
        imgElement.style.maxWidth = "200px";  
        imgElement.style.maxHeight = "200px";
 
        messageElement.appendChild(imgElement);
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    uploadBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', async () => {
        const file = imageUpload.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
     
        reader.onloadend = () => {
            const base64Image = reader.result.split(',')[1];  // Remove the "data:image/png;base64," prefix
            sessionStorage.setItem('uploaded_image', base64Image);
            displayImage(base64Image, 'user');
            // displayMessage('Image uploaded successfully', 'user');
        };
     
        reader.onerror = () => {
            alert('Failed to read the file!');
        };
       
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
    // const chatmenu = document.getElementById('chat');
    // const chatarea = document.getElementById('chat-container');

    // chatmenu.addEventListener('click', () => {
    //     chatarea.classList.toggle('hidden');
    // });

});





