#!/bin/bash

################################
# Run local development network
################################
if [[ ( $# -eq 0 ) || ( $# -gt 3 ) || ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: $0 [org no] {auth | gw-org} {test}"
  echo "[org no] : number of org to startup"
  echo "{gw-org} : option to startup include gw-org"
  echo "{test}   : option to startup include tester"
  echo " ---- Example ---- "
  echo " $0 0             : startup with postgres / redis "
  echo " $0 0 auth        : startup with auth server / postgres / redis "
  echo " $0 1             : startup fabric network with 1 organization with auth server / postgres / redis / chaincode"
  echo " $0 2 gw-org test : startup fabric network with 2 organizations with auth server / postgres / redis / chaincode / gw-org1 / gw-org2 / tester and run test"
  echo " $0 3 gw-org      : startup fabric network with 3 organizations with auth server / postgres / redis / chaincode / gw-org1 / gw-org2/ gw-org3 "
  exit 0
fi

if ! [[ -z $1 || "$1" =~ ^[0-9]+$ ]]; then
  echo "invalid arg [org no] : $1!!! only accept integer"
  exit 0
fi
if [[ "$1" -lt 0 ]] || [[ "$1" -gt 9 ]]; then
  echo "invalid arg [org no] must within 0 to 9 "
  exit 0
fi
if [[ ! -z $2 && ( $2 != "auth" && $2 != "gw-org" ) ]]; then
  echo "invalid arg : $2 !!! only accept \"auth\" or \"gw-org\""
  exit 0
fi
if [[ ! -z $2 && $2 == "gw-org" && ( "$1" -gt 3 || "$1" -lt 1 ) ]]; then
  echo "invalid arg : $2 !!! \"gw-org\" only allow [org no] within 1 to 3"
  exit 0
fi
if [[ ! -z $3 && ( $3 != "test") ]]; then
  echo "invalid arg : $3 !!! only accept \"test\""
  exit 0
fi
if [[ ! -z $3 && $3 == "test" && ( "$1" -gt 3 || "$1" -lt 2 ) ]]; then
  echo "invalid arg : $3 !!! \"test\" only allow [org no] within 2 to 3"
  exit 0
fi
if [[ ! -z $3 && $3 == "test" && $2 != "gw-org" ]]; then
  echo "invalid arg : $3 !!! \"test\" only allow [gw-org]"
  exit 0
fi
SECONDS=0

if [[ "$1" -ge 1 && "$1" -le 9 ]]; then
  ./bootstrap_supp.sh $@
else
  ./bootstrap_zero.sh $2 $3
fi

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

