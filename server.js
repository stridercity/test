// server.js

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
    const videoBuffer = req.file.buffer; // You may need to adapt this based on your implementation
    const filePath = 'public/animation.webm';

    fs.writeFile(filePath, videoBuffer, (err) => {
        if (err) {
            console.error('Error saving video:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log('Video saved successfully');
            res.json({ success: true });
        }
    });
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
