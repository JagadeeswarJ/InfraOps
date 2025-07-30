#!/bin/bash

# Start client in background
cd client
npm i && npm run dev &
CLIENT_PID=$!
cd ..

# Start server in background
cd server
npm i && npm run dev &
SERVER_PID=$!
cd ..

# Wait for both processes to exit
wait $CLIENT_PID
wait $SERVER_PID
