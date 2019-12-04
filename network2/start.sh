./cleanup.sh
sleep 2
cd scripts
./up.sh
./gen_certs.sh
./up.sh
./create_genesis.sh
./up.sh
./join_channel.sh

echo "The network is started."