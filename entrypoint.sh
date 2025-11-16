#!/bin/sh
set -e

echo "Starting ClamAV services..."

# Start freshclam in the background to update virus definitions
echo "Starting freshclam..."
freshclam -d || echo "Warning: freshclam failed to start, continuing anyway..."

# Give freshclam a moment to start
sleep 3

# Start clamd daemon in the background
echo "Starting clamd..."
clamd &

# Wait for clamd to create the socket or start listening on TCP port
echo "Waiting for clamd to be ready..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    # Check if Unix socket exists
    if [ -S /tmp/clamd.sock ]; then
        echo "✓ clamd Unix socket found at /tmp/clamd.sock"
        break
    fi
    # Check if TCP port 3310 is listening (if netcat is available)
    if command -v nc >/dev/null 2>&1 && nc -z localhost 3310 2>/dev/null; then
        echo "✓ clamd is listening on TCP port 3310"
        break
    fi
    # Check if clamd process is running
    if ps aux | grep -v grep | grep -q "[c]lamd"; then
        # Process exists, give it more time
        if [ $WAITED -gt 10 ]; then
            echo "clamd process is running, assuming it's ready..."
            break
        fi
    fi
    echo "Waiting for clamd... ($WAITED/$MAX_WAIT seconds)"
    sleep 1
    WAITED=$((WAITED + 1))
done

# Final check - verify clamd process is running
if ! ps aux | grep -v grep | grep -q "[c]lamd"; then
    echo "ERROR: clamd process not found!"
    echo "Checking logs..."
    tail -50 /var/log/clamav/clamd.log 2>/dev/null || echo "No log file found"
    echo "Attempting to start clamd in foreground to see errors..."
    clamd || exit 1
fi

# Verify clamd is listening
if [ -S /tmp/clamd.sock ]; then
    echo "✓ clamd Unix socket exists at /tmp/clamd.sock"
fi

if command -v nc >/dev/null 2>&1 && nc -z localhost 3310 2>/dev/null; then
    echo "✓ clamd is listening on TCP port 3310"
else
    echo "Note: Could not verify TCP port (netcat not available), but clamd process is running"
fi

# Keep container running and monitor processes
echo "ClamAV services are running. Monitoring..."
while true; do
    # Check if clamd is still running
    if ! ps aux | grep -v grep | grep -q "[c]lamd"; then
        echo "ERROR: clamd process died!"
        exit 1
    fi
    sleep 10
done

