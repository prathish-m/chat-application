# Chat-Application

## Technologies Used
- HTML,JS for the frontend
- JWT Tokens for authentication
- Node/Express for creating API Endpoints
- Google gemini for LLM response
- Mongo DB for storing the chats and user details
- Socket.io for real time communication

## Features 
- New users can register themselves 
- User can login through their credentials
- All passwords are encrypted and stored
- User can chat with other users by searching in their user name search bar 
- All chats will be retrived when the user chats with the same person
- User can set their status to `BUSY` or `AVAILABLE`
- User who set their stauts to `BUSY` won't receive message from any other users
- When user tries to send message to a person whose status is `BUSY` an appropriate message will be sent to the user indicatiing the `Status`




## GET STARTED
To run this application locally, follow these steps:
1. Clone this repository.
2. Install [Node.Js](https://nodejs.org/en/download) and [Mondo DB](https://www.mongodb.com/try/download/community).
3. Navigate to the `Server` folder and run `npm install`.
4. Navigate to `Server` folder and open .env varible file.
  - Set `PORT` value to `3000`.
  - Set `SECRET_KEY` value to any random value.
  - Set your API_KEY for LLM. To get one click [here](https://ai.google.dev/gemini-api/docs/api-key).
5. After installing MongoDB, open `MongoDBCompass` application and create a database named `Chat-Application`.
6. Create these following Collections in the `Chat-Application` database.
  - `Chat-sequence-number`.
  - `Chats`.
  - `Status`.
  - `Users`.
7. Navigate to `Server/Data/database.js` and set `URI` to your MongoDB URI (Note: Change URI only if the default one doesn't work). 
8. To run the Server.
  - Navigate to the `Server` folder and run `node app.js`
9. The application will be available at `http://localhost:3000`.
