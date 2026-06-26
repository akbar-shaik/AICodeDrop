require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Increase limit to 100mb to allow massive codebase text files
app.use(express.json({ limit: '100mb' }));

// 1. Serve the frontend UI from the root folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Secure endpoint to handle the Telegram Upload
app.post('/api/telegram-backup', async (req, res) => {
    const { fileName, fileContent, userInfo } = req.body;
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        return res.status(500).json({ error: 'Telegram credentials missing in .env file.' });
    }

    try {
        // Prepare the payload for Telegram's multipart/form-data API
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', userInfo);
        formData.append('parse_mode', 'Markdown');
        
        // Convert the raw text string into a Blob/File object for uploading
        const fileBlob = new Blob([fileContent], { type: 'text/plain' });
        formData.append('document', fileBlob, fileName);

        // Send to Telegram securely from the backend
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Telegram Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload to Telegram.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Secure Server running on http://localhost:${PORT}`);
});

// const express = require('express');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = 3000;

// // 1. Send the index.html file from the root directory
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// app.use(express.json({ limit: '50mb' }));

// const allowedExtensions = [
//   '.html', '.css', '.js', '.jsx', '.ts', '.tsx', 
//   '.sql', '.py', '.json', '.env', '.md', '.yml', '.yaml'
// ];
// const ignoreDirs = ['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', 'venv'];

// // --- Helper: Generate ASCII Folder Tree ---
// function generateAsciiTree(folderName, filePaths) {
//     const root = {};
    
//     filePaths.forEach(filePath => {
//         const parts = filePath.split(/[/\\]/); 
//         let current = root;
//         parts.forEach((part, i) => {
//             if (!current[part]) {
//                 current[part] = (i === parts.length - 1) ? null : {};
//             }
//             current = current[part];
//         });
//     });

//     function drawTree(node, prefix = '') {
//         let result = '';
//         const keys = Object.keys(node);
//         keys.forEach((key, index) => {
//             const isLast = index === keys.length - 1;
//             const pointer = isLast ? '└── ' : '├── ';
//             const isFolder = node[key] !== null;
            
//             result += `${prefix}${pointer}${key}${isFolder ? '/' : ''}\n`;
            
//             if (isFolder) {
//                 const extension = isLast ? '    ' : '│   ';
//                 result += drawTree(node[key], prefix + extension);
//             }
//         });
//         return result;
//     }

//     return `${folderName}/\n${drawTree(root)}`;
// }

// // --- ENDPOINT 1: Scan and list files ---
// app.post('/api/scan', (req, res) => {
//     const { folderPath } = req.body;
//     if (!folderPath) return res.status(400).json({ error: 'Folder path is required.' });

//     const targetDir = path.resolve(folderPath);
//     if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
//         return res.status(400).json({ error: 'Invalid directory path.' });
//     }

//     const filesFound = [];

//     function scanDir(currentDir) {
//         try {
//             const items = fs.readdirSync(currentDir, { withFileTypes: true });
//             for (const item of items) {
//                 const fullPath = path.join(currentDir, item.name);
//                 if (item.isDirectory()) {
//                     if (!ignoreDirs.includes(item.name)) scanDir(fullPath);
//                 } else if (item.isFile()) {
//                     const ext = path.extname(item.name).toLowerCase();
//                     if (allowedExtensions.includes(ext) || item.name === '.env') {
//                         filesFound.push(path.relative(targetDir, fullPath));
//                     }
//                 }
//             }
//         } catch (err) {
//             console.error(`Skipped ${currentDir}: ${err.message}`);
//         }
//     }

//     scanDir(targetDir);
//     res.json({ folderName: path.basename(targetDir), files: filesFound, basePath: targetDir });
// });

// // --- ENDPOINT 2: Generate the context file with Tree & Custom Text ---
// app.post('/api/generate', (req, res) => {
//     const { basePath, folderName, selectedFiles, customStartText, customEndText } = req.body;
    
//     if (!basePath || !selectedFiles || !Array.isArray(selectedFiles)) {
//         return res.status(400).json({ error: 'Invalid data provided.' });
//     }

//     let outputContent = "";

//     if (customStartText && customStartText.trim() !== "") {
//         outputContent += `--- Codebase Context Generated by: https://akbar-shaik.github.io/AICodeDrop ---\n\n`;
//         outputContent += `================================================================================\n`;
//         outputContent += `USER INSTRUCTIONS / CONTEXT:\n`;
//         outputContent += `================================================================================\n`;
//         outputContent += `${customStartText}\n\n`;
//     }

//     outputContent += `================================================================================\n`;
//     outputContent += `PROJECT FOLDER STRUCTURE:\n`;
//     outputContent += `================================================================================\n`;
//     outputContent += generateAsciiTree(folderName, selectedFiles);
//     outputContent += `\n\n`;

    

//     for (const relativeFilePath of selectedFiles) {
//         const fullPath = path.join(basePath, relativeFilePath);
//         try {
//             if (fs.existsSync(fullPath)) {
//                 const content = fs.readFileSync(fullPath, 'utf8');
//                 outputContent += `\n\n================================================================================\n`;
//                 outputContent += `File: ${relativeFilePath}\n`;
//                 outputContent += `================================================================================\n\n`;
//                 outputContent += content;
//             }
//         } catch (err) {
//             console.error(`Error reading ${fullPath}`);
//         }
//     }

//     if (customEndText && customEndText.trim() !== "") {
//         outputContent += `\n\n================================================================================\n`;
//         outputContent += `USER PROMPT / TASK:\n`;
//         outputContent += `================================================================================\n`;
//         outputContent += `${customEndText}\n`;
//     }

//     res.setHeader('Content-Type', 'text/plain');
//     res.setHeader('Content-Disposition', `attachment; filename="${folderName}_context.txt"`);
//     res.send(outputContent);
// });

// app.listen(PORT, () => {
//     console.log(`🚀 Server is running on http://localhost:${PORT}`);
// });