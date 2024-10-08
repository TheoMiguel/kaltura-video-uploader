
import { API_KEY } from './keys.js';

const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const uploadBtn = document.getElementById('upload-btn');
const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const entryIdSpan = document.getElementById('entry-id');
const uploadAnotherBtn = document.getElementById('upload-another-btn');

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileName.textContent = `Selected file: ${e.target.files[0].name}`;
        uploadBtn.style.display = 'inline-block';
    }
});

uploadBtn.addEventListener('click', async () => {
    
    uploadBtn.disabled = true;
    var name = document.getElementById("entry-name").value;

    if (!name) {
        alert('Please enter a name for the entry.');
        uploadBtn.disabled = false;
        return;
    }

    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    start_kaltura_session();
});

uploadAnotherBtn.addEventListener('click', resetUpload);

function resetUpload() {
    uploadBtn.disabled = false;
    fileInput.value = '';
    fileName.textContent = '';
    uploadBtn.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    document.getElementById('entry-name').value = '';
    document.getElementById('entry-description').value = '';
    document.getElementById('entry-type').value = '1';
    resultSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
}

var client;
var upload_token_id;
var media_entry_id;

function start_kaltura_session(){
    var partnerId = 1836561;
    var config = new KalturaConfiguration(partnerId);
    config.serviceUrl = "http://www.kaltura.com";
    
    client = new KalturaClient(config);
    
    var secret = API_KEY;
    var userId = null;
    var type = 0; // KalturaSessionType.USER
    var expiry = null;
    var privileges = null;

    KalturaSessionService.start(secret, userId, type, partnerId, expiry, privileges)
    .execute(client, function(success, ks) {
        if (!success || (ks && ks.code && ks.message)) {
            console.log('Kaltura Error', success, ks);
        } else {
            progressBar.style.width = '20%';
            progressText.textContent = '20%';
            console.log('Termino session start (1)', ks);
            client.setKs(ks);
            add_kaltura_upload_token();    
        }
    });
    
}

function add_kaltura_upload_token(){
    var uploadToken = {objectType: "KalturaUploadToken"};

    KalturaUploadTokenService.add(uploadToken)
    .execute(client, function(success, result) {
        if (!success || (result && result.code && result.message)) {
            console.log('Kaltura Error', success, result);
        } else {
            progressBar.style.width = '40%';
            progressText.textContent = '40%';
            upload_token_id = result.id;                        
            upload_kaltura_upload_token();  
            console.log('Termino upload token add (2)', result);
        }
    });
}

function upload_kaltura_upload_token(){
    var file_data = document.getElementById("file-input");
    var resume = false;
    var finalChunk = true;
    var resumeAt = -1;

    KalturaUploadTokenService.upload(upload_token_id, file_data, resume, finalChunk, resumeAt)
    .execute(client, function(success, result) {
        if (!success || (result && result.code && result.message)) {
            console.log('Kaltura Error', success, result);
        } else {
            progressBar.style.width = '60%';
            progressText.textContent = '60%';
            console.log('termino upload token upload (3)', result);
            create_media_entry();
        }
    });
}

function create_media_entry(){
    var entry = {objectType: "KalturaMediaEntry"};

    entry.mediaType = document.getElementById("entry-type").value;
    entry.name = document.getElementById("entry-name").value;
    entry.description = document.getElementById("entry-description").value;

    KalturaMediaService.add(entry)
    .execute(client, function(success, results) {
        if (!success || (results && results.code && results.message)) {
            console.log('Kaltura Error', success, results);
        } else {
            progressBar.style.width = '80%';
            progressText.textContent = '80%';
            console.log('termino media entry add (4)', results);
            media_entry_id = results.id;
            add_content_to_media_entry();
        }
    });
}

function add_content_to_media_entry(){
    var resource = {objectType: "KalturaUploadedFileTokenResource"};
    resource.token = upload_token_id;

    KalturaMediaService.addContent(media_entry_id, resource)
    .execute(client, function(success, results) {
        if (!success || (results && results.code && results.message)) {
            console.log('Kaltura Error', success, results);
        } else {
            progressBar.style.width = '100%';
            progressText.textContent = '100%';

            console.log('termino media entry add content (5)', results);

            entryIdSpan.textContent = media_entry_id;
            loadingSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
        }
    });
}

const copyButton = document.querySelector('.copy-button');
copyButton.addEventListener('click', function() {
    const responseContent = document.querySelector('#entry-id');
    copyTextToClipboard(responseContent.textContent);
});

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showToast('ID copied to clipboard');
    }, function(err) {
        console.error('Could not copy ID: ', err);
        showToast('Failed to copy ID');
    });
}

function showToast(message) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Trigger reflow to enable transition
    toast.offsetHeight;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300); // Wait for the fade out transition to complete
    }, 3000); // Show the toast for 3 seconds
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}