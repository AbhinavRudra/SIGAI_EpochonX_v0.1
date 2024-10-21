let mediaRecorder;
let audioChunks = [];

// Check for MediaRecorder support 
if (!navigator.mediaDevices || !window.MediaRecorder) { 
    alert('MediaRecorder is not supported in your browser.'); 
}

document.getElementById('startRecordingBtn').addEventListener('click', function() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            document.getElementById('startRecordingBtn').style.display = 'none';
            document.getElementById('stopRecordingBtn').style.display = 'block';

            mediaRecorder.ondataavailable = function(event) {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = function() {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.onload = function(event) {
                    const audioData = new Uint8Array(event.target.result);
                    convertAudioToText(audioData); // Pass raw audio data for the API
                };
                reader.readAsArrayBuffer(audioBlob); // Use readAsArrayBuffer to get raw data
            };
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
            alert('Could not access your microphone. Please check your permissions.');
        });
});

// Stop recording when button is clicked
document.getElementById('stopRecordingBtn').addEventListener('click', function() {
    mediaRecorder.stop();
    document.getElementById('stopRecordingBtn').style.display = 'none';
    document.getElementById('startRecordingBtn').style.display = 'block';
});

function convertAudioToText(audioData) {
    const apiUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3'; // Updated API URL
    const headers = {
        'Authorization': 'Bearer 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', // Update with your token
        'Content-Type': 'application/octet-stream'
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: audioData // Send the audio data directly
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.text) {
            document.getElementById('outputText').textContent = data.text;
            document.getElementById('summarizeBtn').style.display = 'block';
            summarizeText(data.text);
        } else {
            console.error('Transcription failed:', data);
            alert('Transcription failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while transcribing the audio.');
    });
}

// Function to summarize the text
function summarizeText(text) {
    const apiUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
    const headers = {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
    };

    const payload = {
        "inputs": text
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data && data[0] && data[0].summary_text) {
            document.getElementById('summary').textContent = data[0].summary_text;
            document.getElementById('downloadPdfBtn').style.display = 'block';
        } else {
            console.error('Summarization failed:', data);
            alert('Summarization failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while summarizing the text.');
    });
}

// Download the summary as a PDF
document.getElementById('downloadPdfBtn').addEventListener('click', function() {
    const summaryText = document.getElementById('summary').textContent;

    if (!summaryText) {
        alert('No summary to download.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Meeting Summary", 10, 10); 
    doc.text(summaryText, 10, 20);  
    doc.save('meeting_summary.pdf');  
}); 
