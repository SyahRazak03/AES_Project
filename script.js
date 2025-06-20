
let originalImageData = null;
let modifiedImageData = null;
let encryptedImageData = null;


function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    const tablinks = document.getElementsByClassName("tablinks");

    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// untuk image upload
document.getElementById('originalImage').addEventListener('change', function(e) {
    console.log('File input changed');
    const file = e.target.files[0];
    const uploadArea = document.querySelector('.image-upload-area');
    const preview = document.getElementById('imagePreview');
    const uploadContent = document.querySelector('.upload-content');

    if (!file) {
        console.log('No file selected');
        return;
    }

    if (!file.type.match('image.*')) {
        console.log('Invalid file type:', file.type);
        showStatus('hideStatus', 'Please select an image file (JPEG or PNG)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        console.log('FileReader loaded');
        preview.src = event.target.result;
        preview.style.display = 'block';
        preview.classList.add('loaded');
        uploadArea.classList.add('has-image');
        uploadContent.style.display = 'none';
        originalImageData = event.target.result;
        console.log('Preview updated with src:', preview.src.substring(0, 50) + '...');
    };
    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        showStatus('hideStatus', 'Error reading image file', 'error');
    };
    console.log('Reading file:', file.name);
    reader.readAsDataURL(file);
});

document.getElementById('originalImage').addEventListener('click', function(e) {
    console.log('OriginalImage clicked');
    if (!originalImageData) {
        const preview = document.getElementById('imagePreview');
        const uploadArea = document.querySelector('.image-upload-area');
        const uploadContent = document.querySelector('.upload-content');

        preview.style.display = 'none';
        preview.classList.remove('loaded');
        uploadArea.classList.remove('has-image');
        uploadContent.style.display = 'flex';
        originalImageData = null;
        console.log('Reset upload area');
    }
});

document.getElementById('modifiedImage').addEventListener('change', function(e) {
    console.log('Modified image input changed');
    const file = e.target.files[0];
    const uploadArea = e.target.closest('.image-upload-area');
    const preview = document.getElementById('extractImagePreview');
    const uploadContent = uploadArea.querySelector('.upload-content');

    if (!file) {
        console.log('No file selected');
        return;
    }

    if (!file.type.match('image.*')) {
        console.log('Invalid file type:', file.type);
        showStatus('extractStatus', 'Please select an image file (JPEG or PNG)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        console.log('FileReader loaded for modified image');
        preview.src = event.target.result;
        preview.style.display = 'block';
        uploadArea.classList.add('has-image');
        uploadContent.style.display = 'none';
        modifiedImageData = event.target.result;
        console.log('Extract preview updated with src:', preview.src.substring(0, 50) + '...');
    };
    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        showStatus('extractStatus', 'Error reading image file', 'error');
    };
    console.log('Reading file:', file.name);
    reader.readAsDataURL(file);
});

// Encryption dengan Decryption punya function
function generateRandomKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let key = "";
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('encryptionKey').value = key;
}

function hideMessageInImage() {
    const message = document.getElementById('secretMessage').value;
    const key = document.getElementById('encryptionKey').value;

    if (!originalImageData) {
        showStatus('hideStatus', 'Please upload an image first', 'error');
        return;
    }

    if (!message || !key) {
        showStatus('hideStatus', 'Please enter both message and key', 'error');
        return;
    }

    try {
        const encryptedMessage = CryptoJS.AES.encrypt(message, key).toString();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const binaryMessage = stringToBinary(encryptedMessage);
            const messageLength = binaryMessage.length;

            const maxMessageLength = data.length * 0.3;
            if (messageLength > maxMessageLength) {
                showStatus('hideStatus', 'Message too large for this image. Try a shorter message or larger image.', 'error');
                return;
            }

            const lengthBinary = messageLength.toString(2).padStart(32, '0');
            for (let i = 0; i < 32; i++) {
                const pixelIndex = i * 4;
                data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(lengthBinary[i]);
            }

            for (let i = 0; i < messageLength; i++) {
                const pixelIndex = (i + 32) * 4;
                const channel = i % 3;
                data[pixelIndex + channel] = (data[pixelIndex + channel] & 0xFE) | parseInt(binaryMessage[i]);
            }

            ctx.putImageData(imageData, 0, 0);
            modifiedImageData = canvas.toDataURL();
            updateEncryptedImage(canvas.toDataURL());
        };

        img.src = originalImageData;
    } catch (e) {
        showStatus('hideStatus', 'Error: ' + e.message, 'error');
    }
}

function extractMessageFromImage() {
    const key = document.getElementById('extractKey').value;

    if (!modifiedImageData) {
        showStatus('extractStatus', 'Please upload an image first', 'error');
        return;
    }

    if (!key) {
        showStatus('extractStatus', 'Please enter the encryption key', 'error');
        return;
    }

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let lengthBinary = '';
            for (let i = 0; i < 32; i++) {
                const pixelIndex = i * 4;
                lengthBinary += data[pixelIndex] & 1;
            }
            const messageLength = parseInt(lengthBinary, 2);

            let binaryMessage = '';
            for (let i = 0; i < messageLength; i++) {
                const pixelIndex = (i + 32) * 4;
                const channel = i % 3;
                binaryMessage += data[pixelIndex + channel] & 1;
            }

            const encryptedMessage = binaryToString(binaryMessage);
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedMessage, key);
            const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedMessage) {
                showStatus('extractStatus', 'Wrong key or no hidden message found', 'error');
                return;
            }

            document.getElementById('extractedMessage').value = decryptedMessage;
            document.getElementById('extractedMessageSection').style.display = 'block';
        };

        img.src = modifiedImageData;
    } catch (e) {
        showStatus('extractStatus', 'Error: ' + e.message, 'error');
    }
}

// untuk download
function downloadEncryptedImage() {
    if (!encryptedImageData) return;

    const link = document.createElement('a');
    link.href = encryptedImageData;
    link.download = 'secret_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function updateEncryptedImage(imageData) {
    const encryptedPreview = document.getElementById('encryptedImagePreview');
    const encryptedArea = document.querySelector('.encrypted-image-area');
    const downloadButton = document.getElementById('downloadEncryptedImage');

    encryptedPreview.src = imageData;
    encryptedPreview.style.display = 'block';
    encryptedArea.classList.add('has-image');
    downloadButton.style.display = 'block';
    encryptedImageData = imageData;
}

function stringToBinary(str) {
    let binary = '';
    for (let i = 0; i < str.length; i++) {
        binary += str.charCodeAt(i).toString(2).padStart(8, '0');
    }
    return binary;
}

function binaryToString(binary) {
    let str = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        str += String.fromCharCode(parseInt(byte, 2));
    }
    return str;
}

function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'status ' + type;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

function copyEncryptionKey() {
    const keyInput = document.getElementById('encryptionKey');
    keyInput.select();
    document.execCommand('copy');

    const copyBtn = event.target;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
    }, 2000);
}


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('hideTab').style.display = 'block';
    document.querySelector('.tablinks').classList.add('active');
});