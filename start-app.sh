#!/bin/bash

echo "Starting WPCLife - Angular + Spring Boot + MongoDB"

# Start MongoDB in background
echo "Starting MongoDB..."
mongod --dbpath /tmp/mongodb --fork --logpath /tmp/mongodb.log 2>/dev/null || echo "MongoDB may already be running"

# Install Angular dependencies if needed
echo "Setting up Angular frontend..."
cd wpclife-frontend
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi

# Start Angular dev server in background
echo "Starting Angular frontend on port 5000..."
npm start -- --host 0.0.0.0 --port 5000 &
ANGULAR_PID=$!

# Wait for Angular to start
sleep 5

# Start Spring Boot backend
echo "Starting Spring Boot backend on port 8080..."
cd ../wpclife-backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8080" &
SPRING_PID=$!

echo ""
echo "Application started!"
echo "  Frontend: http://0.0.0.0:5000"
echo "  Backend API: http://0.0.0.0:8080"
echo ""

# Wait for both processes
wait $ANGULAR_PID $SPRING_PID
