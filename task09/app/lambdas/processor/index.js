const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({});
const weatherTableName = process.env.table_name || "Weather";

// Define the Lambda handler
exports.handler = async (event) => {
  try {
    const response = await axios.get(
      "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
    );

    const {
      elevation,
      generationtime_ms,
      hourly,
      hourly_units,
      latitude,
      longitude,
      timezone,
      timezone_abbreviation,
      utc_offset_seconds,
    } = response.data;

    const weatherItem = {
      id: { S: uuidv4() },
      forecast: {
        M: {
          elevation: { N: elevation.toString() },
          generationtime_ms: { N: generationtime_ms.toString() },
          hourly: {
            M: {
              temperature_2m: {
                L: hourly.temperature_2m.map((temp) => ({
                  N: temp.toString(),
                })),
              },
              time: { L: hourly.time.map((t) => ({ S: t })) },
            },
          },
          hourly_units: {
            M: {
              temperature_2m: { S: hourly_units.temperature_2m },
              time: { S: hourly_units.time },
            },
          },
          latitude: { N: latitude.toString() },
          longitude: { N: longitude.toString() },
          timezone: { S: timezone },
          timezone_abbreviation: { S: timezone_abbreviation },
          utc_offset_seconds: { N: utc_offset_seconds.toString() },
        },
      },
    };

    const command = new PutItemCommand({
      TableName: weatherTableName,
      Item: weatherItem,
    });

    await dynamoDBClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data inserted successfully" }),
    };
  } catch (error) {
    console.error("Error inserting data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to insert data",
        error: error.message,
      }),
    };
  }
};