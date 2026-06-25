let selectedFile = null;
let extractedSubjects = [];
let extractedData = null; 
let editingIndex = null;

// ✅ FIXED IDs
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

// ✅ CLICK TO SELECT
uploadZone.addEventListener('click', () => fileInput.click());

// ✅ FILE SELECTION
fileInput.addEventListener('change', function () {
    if (this.files.length > 0) {
        const file = this.files[0];

        // Validate
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload PDF, JPG, or PNG.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Max size is 10MB.');
            return;
        }

        selectedFile = file;

        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent =
            (file.size / 1024 / 1024).toFixed(2) + " MB";

        uploadZone.classList.add('hidden');
        document.getElementById('previewCard').classList.add('active');
    }
});

// ✅ REMOVE FILE
function removeFile() {
    selectedFile = null;
    fileInput.value = '';

    document.getElementById('previewCard').classList.remove('active');
    uploadZone.classList.remove('hidden');
}

// ✅ MAIN UPLOAD FUNCTION (NO POLLING)
async function startUpload() {
    if (!selectedFile) {
        alert("Please select a file first");
        return;
    }

    const formData = new FormData();
    formData.append('reportCard', selectedFile);

    document.getElementById('previewCard').classList.remove('active');
    document.getElementById('processingCard').classList.add('active');

    try {
        const response = await fetch('/api/results/upload', {
            method: 'POST',
            body: formData
        });

       let data;

try {
    data = await response.json();
} catch (e) {
    throw new Error("Server returned invalid response (HTML instead of JSON)");
}
        console.log("✅ Server response:", data);

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
// ✅ STOP LOADER (ONLY ONCE)
document.getElementById('processingCard').classList.remove('active');

// ✅ SHOW RESULTS
displayResults(data);

    } catch (error) {
        console.error(error);
        document.getElementById('processingCard').classList.remove('active');
        document.getElementById('errorCard').classList.add('active');
    }
}

function displayResults(data) {
    window.extractedData = data; 

    extractedSubjects = data.subjects || [];

    document.getElementById('resultsCard').classList.add('active');

    const table = document.getElementById('subjectsTable');
    table.innerHTML = '';

    extractedSubjects.forEach((subj, index) => {
        const row = `
            <tr>
                <td>${subj.subject}</td>  
                <td>
                    <input type="number" class="mark-input"
                        value="${subj.mark}"
                        onchange="calculateAPS()">
                </td>
                <td>
                    <span class="level-badge level-${subj.level}">
                        Level ${subj.level}
                    </span>
                </td>
                <td>${subj.aps_points}</td> 
            </tr>
        `;
        table.insertAdjacentHTML('beforeend', row);
    });

    document.getElementById('apsValue').textContent =
        data.apsScore || calculateAPS();
}

//  APS CALCULATION
function calculateAPS() {
    const inputs = document.querySelectorAll('.mark-input');

    let marks = Array.from(inputs)
        .map(i => parseInt(i.value) || 0)
        .sort((a, b) => b - a)
        .slice(0, 6);

    let total = 0;

    marks.forEach(mark => {
        if (mark >= 80) total += 7;
        else if (mark >= 70) total += 6;
        else if (mark >= 60) total += 5;
        else if (mark >= 50) total += 4;
        else if (mark >= 40) total += 3;
        else if (mark >= 30) total += 2;
    });

    document.getElementById('apsValue').textContent = total;
    return total;
}