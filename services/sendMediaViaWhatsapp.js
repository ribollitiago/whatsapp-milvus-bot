async function sendMediaViaWhatsApp(userId, fileBuffer) {
    const WHATSAPP_API_URL = 'https://graph.facebook.com/v13.0';
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename: 'attachment.jpg' });
        const uploadResponse = await axios.post(
            `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    ...formData.getHeaders()
                }
            }
        );

        const mediaId = uploadResponse.data.id;

        await axios.post(
            `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: userId,
                type: 'image',
                image: { id: mediaId }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[${getCurrentTime()}]Media sent to ${userId}: ${mediaId}`);
    } catch (err) {
        console.error(`[${getCurrentTime()}]Erro ao enviar media: ${err.message}`);
        throw err;
    }
}