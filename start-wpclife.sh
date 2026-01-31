#!/bin/bash
set -e

echo "=== WPCLife Angular + Spring Boot Application ==="

# Create MongoDB data directory
mkdir -p /tmp/mongodb

# Start MongoDB
echo "[1/4] Starting MongoDB..."
mongod --dbpath /tmp/mongodb --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongodb.log 2>/dev/null || true
sleep 2

# Install Angular dependencies using npx
echo "[2/4] Installing Angular dependencies..."
cd wpclife-frontend
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    npm install --legacy-peer-deps --no-audit --no-fund 2>&1 || {
        echo "Trying with npx..."
        npx -y npm@10 install --legacy-peer-deps --no-audit --no-fund
    }
fi

# Start Angular dev server in background
echo "[3/4] Starting Angular frontend on port 5000..."
npx -y @angular/cli@17 serve --host 0.0.0.0 --port 5000 --disable-host-check &
ANGULAR_PID=$!

cd ..

# Start Spring Boot backend
echo "[4/4] Starting Spring Boot backend on port 8080..."
cd wpclife-backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8080 -Dspring.data.mongodb.uri=mongodb://127.0.0.1:27017/wpclife" &
SPRING_PID=$!

echo ""
echo "=== Application Starting ==="
echo "Frontend: http://0.0.0.0:5000"
echo "Backend:  http://0.0.0.0:8080"
echo ""

# Wait for processes
wait $ANGULAR_PID $SPRING_PID
