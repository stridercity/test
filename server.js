const express = require('express');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/save-video', upload.single('video'), (req, res) => {
    console.log('Received video upload request');
    
    // Ensure the request contains a file
    if (!req.file) {
        console.error('No video file received');
        return res.status(400).json({ error: 'No video file received' });
    }

    const videoBuffer = req.file.buffer;
    const filePath = 'public/animation.webm';

    fs.writeFile(filePath, videoBuffer, (err) => {
        if (err) {
            console.error('Error saving video:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        console.log('Video saved successfully');
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
