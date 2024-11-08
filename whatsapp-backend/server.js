require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json()); // Middleware para parsear JSON

const PORT = process.env.PORT || 3000;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v13.0/354054064454005/messages';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

app.post('/send-message', async (req, res) => {
    const { message, to } = req.body;
    try {
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: message }
        }, {
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
        });
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error sending message:', error.response.data);
        res.status(500).json({ success: false, error: error.response.data });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
