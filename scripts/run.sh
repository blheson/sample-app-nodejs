#!/bin/bash
cd ~/$APPLICATION_NAME
pm2 update
pm2 start package.json
pm2 save

#### CHECK NGINX ####

SERVICE_2="nginx"
if sudo pgrep -x "$SERVICE_2" >/dev/null
then
    echo "$SERVICE_2 is running, attempting to reload"
    sudo systemctl reload nginx.service
else
    echo "$SERVICE_2 is stopped, attempting to start it"
     sudo systemctl start nginx.service
fi
