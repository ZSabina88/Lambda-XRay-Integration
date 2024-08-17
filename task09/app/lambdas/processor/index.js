const https = require('https');
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const options = {
        hostname: 'api.open-meteo.com',
        path: '/v1/forecast?latitude=YOUR_LATITUDE&longitude=YOUR_LONGITUDE&hourly=temperature_2m',
        method: 'GET'
    };

    return new Promise((resolve, reject) => {
        https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                const weatherData = JSON.parse(data);
                const params = {
                    TableName: 'Weather',
                    Item: {
                        id: Date.now().toString(),
                        forecast: weatherData.hourly
                    }
                };

                try {
                    await dynamoDB.put(params).promise();
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify('Weather data stored successfully')
                    });
                } catch (err) {
                    reject({
                        statusCode: 500,
                        body: JSON.stringify('Error storing data: ' + err)
                    });
                }
            });
        }).on('error', (e) => {
            reject({
                statusCode: 500,
                body: JSON.stringify('Error fetching data: ' + e.message)
            });
        });
    });
};