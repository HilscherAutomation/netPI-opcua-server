#!/bin/bash +e
# catch signals as PID 1 in a container

# SIGNAL-handler
term_handler() {

  echo "terminating ssh ..."
  sudo /etc/init.d/ssh stop

  exit 143; # 128 + 15 -- SIGTERM
}

# on callback, stop all started processes in term_handler
trap 'kill ${!}; term_handler' SIGINT SIGKILL SIGTERM SIGQUIT SIGTSTP SIGSTOP SIGHUP

echo "Starting ssh ..."
sudo /etc/init.d/ssh start

# check if certs folder is mapped, else stop
if [ -d "/certs" ]; then

  if [ ! -f /certs/server_cert.der ]; then
    echo "No server certificate found. Creating server certificate and private key ..."
    python /open62541/tools/certs/create_self-signed.py /certs
  fi

  #copy certificate for uploading purposes, without private key
  if [ ! -f /open62541/html/certs_copy/server_cert.der ]; then
    cp /certs/server_cert.der /open62541/html/certs_copy
  fi

  if [ -f /open62541/html/server ]; then
    echo "Starting last compiled server"
    /open62541/html/server /certs/server_cert.der /certs/server_key.der &	
  fi

  while true
  do
    # start the html application
    node /open62541/html/upload.js
  done

else
  echo "/certs folder is not available"
fi

# wait forever not to exit the container
while true
do
  tail -f /dev/null & wait ${!}
done

exit 0
