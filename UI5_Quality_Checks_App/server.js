const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3005;

const appPath = "webapp";

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// Configuring Axios instance with a timeout of 10 seconds
const axiosInstance = axios.create({
    timeout: 10000 // Timeout after 10 seconds
});

// Serve static files from the appPath directory
app.use(express.static(path.join(__dirname, appPath)));

// Route for forwarding requests to sapui5.hana.ondemand.com versionoverview.json
app.get('/versionoverview.json', async (req, res) => {
    const url = 'https://sapui5.hana.ondemand.com/versionoverview.json';
    try {
        const response = await axiosInstance.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding request to sapui5.hana.ondemand.com:', error);
        res.status(error.response.status || 500).json({ error: 'Error forwarding request to sapui5.hana.ondemand.com' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
});