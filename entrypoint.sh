#!/bin/sh
set -e

echo "Starting ClamAV services..."

# First, update the virus database (this may take a while on first run)
echo "Updating virus database..."
freshclam || echo "Warning: freshclam update failed, but continuing..."

# Wait a moment for database to be ready
sleep 2

# Verify database files exist
if [ ! -f /var/lib/clamav/main.cvd ] && [ ! -f /var/lib/clamav/main.cld ]; then
    echo "WARNING: No main database found, but continuing..."
fi

# Start freshclam in the background for continuous updates
echo "Starting freshclam daemon..."
freshclam -d || echo "Warning: freshclam daemon failed to start, continuing anyway..."

# Give freshclam a moment to start
sleep 2

# Start clamd daemon in the background and capture errors
echo "Starting clamd..."
# Start clamd in foreground mode (config says Foreground yes) and background it
# This ensures it stays running
nohup clamd > /var/log/clamav/clamd-startup.log 2>&1 &
CLAMD_PID=$!

# Wait a moment to see if it starts or crashes immediately
sleep 5

# Check if process is still running
if ! kill -0 $CLAMD_PID 2>/dev/null; then
    echo "ERROR: clamd process died immediately after starting!"
    echo "=== Startup log ==="
    cat /var/log/clamav/clamd-startup.log 2>/dev/null || echo "No log file"
    echo "=== Main log ==="
    tail -50 /var/log/clamav/clamd.log 2>/dev/null || echo "No main log"
    echo "=== Trying to start clamd directly to see errors ==="
    clamd || {
        echo "clamd failed with exit code $?"
        exit 1
    }
fi

echo "clamd started with PID $CLAMD_PID"

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
    echo "=== clamd startup log ==="
    cat /var/log/clamav/clamd-startup.log 2>/dev/null || echo "No startup log found"
    echo "=== clamd main log ==="
    tail -50 /var/log/clamav/clamd.log 2>/dev/null || echo "No main log file found"
    echo "=== Attempting to start clamd in foreground to see errors ==="
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
LAST_CHECK=0
while true; do
    # Check if clamd is still running (check both the PID and process list)
    CLAMD_RUNNING=false
    if kill -0 $CLAMD_PID 2>/dev/null; then
        CLAMD_RUNNING=true
    elif ps aux | grep -v grep | grep -q "[c]lamd"; then
        # PID might have changed if it daemonized, but process is still running
        CLAMD_RUNNING=true
        echo "Note: clamd PID changed (daemonized?), but process is still running"
    fi
    
    if [ "$CLAMD_RUNNING" = "false" ]; then
        echo "ERROR: clamd process died!"
        # Try to get exit status
        wait $CLAMD_PID 2>/dev/null && EXIT_CODE=$? || EXIT_CODE=$?
        echo "clamd exited with code: $EXIT_CODE"
        echo "=== Checking logs for errors ==="
        echo "=== clamd startup log (last 100 lines) ==="
        tail -100 /var/log/clamav/clamd-startup.log 2>/dev/null || echo "No startup log found"
        echo "=== clamd main log (last 50 lines) ==="
        tail -50 /var/log/clamav/clamd.log 2>/dev/null || echo "No main log file found"
        echo "=== Process list ==="
        ps aux | head -20
        exit 1
    fi
    
    # Every 30 seconds, log that we're still monitoring
    CURRENT_TIME=$(date +%s)
    if [ $((CURRENT_TIME - LAST_CHECK)) -ge 30 ]; then
        echo "Still monitoring... clamd PID: $CLAMD_PID"
        LAST_CHECK=$CURRENT_TIME
    fi
    
    sleep 5
done

