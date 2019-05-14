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

echo "starting ssh ..."
sudo /etc/init.d/ssh start


if [ -f /open62541/html/server ]; then
  echo "Starting last compiled server"
  /open62541/html/server &	
fi

while true
do
# start the html application
node /open62541/html/upload.js

done

# wait forever not to exit the container
while true
do
  tail -f /dev/null & wait ${!}
done

exit 0
