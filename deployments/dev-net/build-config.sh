#!/bin/bash

#######################################
# Gen File with template
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -ne 2 && $# -ne 3 ) || ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: $0 [OrgNumber] [auth gw-org] [test]"
  echo "Eg $0 3 \"auth\" <----- Generate config with 3 org setup and ngx template with auth-server setting only"
  echo "Eg $0 2 \"auth gw-org\" <----- Generate config with 2 org setup and ngx template with auth-server and gw-org setting "
  exit 0
fi

. ./scripts/setup.sh




##################
# Constant
##################
LOG_LVL_TRACE=0
LOG_LVL_DEBUG=1
LOG_LVL_INFO=2
TMPL_COMPOSE_HEADER=tmpl.compose.yaml.header
TMPL_COMPOSE_ORDERER=tmpl.compose.orderer.service
TMPL_COMPOSE_ORG=tmpl.compose.org.service
TMPL_COMPOSE_CC=tmpl.compose.cc.service
TMPL_COMPOSE_DBRD=tmpl.compose.db-red.service
TMPL_COMPOSE_AUTH=tmpl.compose.auth.service
TMPL_COMPOSE_NGX=tmpl.compose.ngx.service
TMPL_NGX_CONF=tmpl.ngx.template
TMPL_FILE_PREFIX="%__"
TMPL_FILE_SUFFIX="__%"
TMPL_VAR_PREFIX="TMPL_PARAM_"

##################
# Input arg
##################
ORG_COUNT=$1
NGX_TMPL=
LOG_FG=$LOG_LVL_INFO

##################
# Local Variable
##################
TMPL_DIR=$CURRENT_DIR/template
WORK_DIR=$ARTIFACTS/.tmp
OUTPUT_DIR=$CURRENT_DIR
WORK_FILE_EXT=.work

########
# function printLog()
# arg1 : logLvl
# arg2 : logMsg
########
function printLog()
{
  local __logLvl=$1
  local __logMsg=$2
  local __now=$(date +"%Y-%m-%d %H:%M:%S")
  if [[ $LOG_FG -le $__logLvl ]] ; then
    echo "$__now ${FUNCNAME[1]} - $2"
  fi
}

########
# function updateFile()
# arg1 : file to be insert
# arg2 : name of param in template file to be insert
# arg3 : template file name
########
function updateFile()
{
  local __insertFile=$1
  local __tmplParam=$2
  local __tmplFile=$3
  printLog $LOG_LVL_DEBUG "__insertFile=$__insertFile"
  printLog $LOG_LVL_DEBUG "__tmplParam=$__tmplParam"
  printLog $LOG_LVL_DEBUG "__tmplFile=$__tmplFile"

  local __lines=`sed -n '/'$__tmplParam'/=' ${__tmplFile} | paste -sd' ' -`
  printLog $LOG_LVL_TRACE "__lines =$__lines"

  # reverse line number for insert text
  local __reverseLine=
  for i in $__lines
  do
    __reverseLine="$i $__reverseLine"
  done
  printLog $LOG_LVL_TRACE "__reverseLine =$__reverseLine"

  # gen the insert content
  cat /dev/null > $WORK_DIR/$WORK_FILE_EXT
  for eachFile in $__insertFile
  do
    cat ${eachFile} >> $WORK_DIR/$WORK_FILE_EXT
  done


  # for each line insert text
  for eachLine in $__reverseLine
  do
    { head -n $(($eachLine-1)) ${__tmplFile}; cat $WORK_DIR/$WORK_FILE_EXT; tail -n +$eachLine ${__tmplFile}; } > ${__tmplFile}$WORK_FILE_EXT
    mv ${__tmplFile}$WORK_FILE_EXT ${__tmplFile}
  done

  # for each remove comment
  __lines=`sed -n '/'$__tmplParam'/=' ${__tmplFile} | paste -sd' ' -`
  local __removeCommand=
  for i in $__lines
  do
    __removeCommand=$__removeCommand$i"d;"
  done
  sed -i$WORK_FILE_EXT -e ''$__removeCommand'' ${__tmplFile}
  rm ${__tmplFile}$WORK_FILE_EXT

}


########
# function templateGenFile()
# arg1 : String , file name of main template to generate
# arg2 : Number , no of orgCount to gen the template
# arg3 : String , file name of generated output
# usage : templateGenFile templateFile orgCount outputFile outputCount
########
function templateGenFile()
{
  local __templateFile=$1
  local __orgCount=$2
  local __outputFile=$3
  printLog $LOG_LVL_DEBUG "__templateFile=$__templateFile"
  printLog $LOG_LVL_DEBUG "__orgCount=$__orgCount"
  printLog $LOG_LVL_DEBUG "__outputFile=$__outputFile"

  local __filepath=$(dirname "$__outputFile")
  local __filename=$(basename -- "$__outputFile")
  printLog $LOG_LVL_TRACE "filepath=$__filepath"
  printLog $LOG_LVL_TRACE "filename=$__filename"

  printLog $LOG_LVL_DEBUG "--------STEP 0------------ prepare output file:$WORK_DIR/$__filename"
  cp -Rp $__templateFile $WORK_DIR/$__filename

  printLog $LOG_LVL_DEBUG "--------STEP 1------------"
  # 1. for the template file, find all the subTemplate files
  local __subTemplateFiles=`sed -n 's/^#.*'$TMPL_FILE_PREFIX'\(.*\)'$TMPL_FILE_SUFFIX'/\1/gp' $__templateFile | sort -u `
  printLog $LOG_LVL_DEBUG "__subTemplateFiles=$__subTemplateFiles"

  for eachFile in $__subTemplateFiles
  do
    # 2. for each subTemplate and template file
    #   2.1 loop orgCount
    #     2.1.1 to generate sed command file
    #     2.1.2 with sed command file, generate subOutput file and outputFile
    printLog $LOG_LVL_DEBUG "--------STEP 2------------ gen $WORK_DIR/$eachFile$WORK_FILE_EXT"
    genFile $__orgCount $TMPL_DIR/$eachFile $WORK_DIR/$eachFile$WORK_FILE_EXT

    # 3. for output file, update with subOutput file
    printLog $LOG_LVL_DEBUG "--------STEP 3------------update $WORK_DIR/$__filename"
    updateFile $WORK_DIR/$eachFile$WORK_FILE_EXT $eachFile $WORK_DIR/$__filename

    #rm $WORK_DIR/$eachFile$WORK_FILE_EXT
  done

  mv $WORK_DIR/$__filename $__outputFile
  printLog $LOG_LVL_INFO "return $__outputFile"
}

########
# function genFile()
# arg1 : loop count
# arg2 : template file
# arg3 : output file
# arg4 : base files
#
########
function genFile()
{
  local __loopCount=$1
  local __templateFile=$2
  local __outputFile=$3
  local __baseFiles=$4
  printLog $LOG_LVL_DEBUG "__loopCount=$__loopCount"
  printLog $LOG_LVL_DEBUG "__templateFile=$__templateFile"
  printLog $LOG_LVL_DEBUG "__outputFile=$__outputFile"
  printLog $LOG_LVL_DEBUG "__baseFiles=$__baseFiles"

  filepath=$(dirname "$__outputFile")
  filename=$(basename -- "$__outputFile")
  printLog $LOG_LVL_TRACE "filepath=$filepath"
  printLog $LOG_LVL_TRACE "filename=$filename"

  # prepare header file
  cat /dev/null > $WORK_DIR/$filename
  if [[ ! -z "${__baseFiles}" ]]
  then
    for eachFile in $__baseFiles
    do
      cat $eachFile >> $WORK_DIR/$filename
    done
  fi

  ##################
  # Template : tmpl.xxxx
  # Variable : VAR_NAME
  # Format   : %__VAR_NAME__%
  ##################
  for ((i=1;i<=$__loopCount;i++));
  do
    replaceTmplParams $i $__templateFile $WORK_DIR/$filename$WORK_FILE_EXT
    cat $WORK_DIR/$filename$WORK_FILE_EXT >> $WORK_DIR/$filename
  done
  rm $WORK_DIR/$filename$WORK_FILE_EXT
  if [[ "$filepath" != "$WORK_DIR" ]]; then
    mv $WORK_DIR/$filename $__outputFile
  fi
  printLog $LOG_LVL_INFO "return $__outputFile"
}

########
# function genMultipleFiles()
# arg1 : loop count
# arg2 : template file
# arg3 : output file
# arg4 : base files
#
########
function genMultipleFiles()
{
  local __loopCount=$1
  local __templateFile=$2
  local __outputFile=$3
  local __baseFiles=$4
  printLog $LOG_LVL_DEBUG "__loopCount=$__loopCount"
  printLog $LOG_LVL_DEBUG "__templateFile=$__templateFile"
  printLog $LOG_LVL_DEBUG "__outputFile=$__outputFile"
  printLog $LOG_LVL_DEBUG "__baseFiles=$__baseFiles"

  filepath=$(dirname "$__outputFile")
  filename=$(basename -- "$__outputFile")
  extension="${filename##*.}"
  filename="${filename%.*}"
  printLog $LOG_LVL_TRACE "filepath=$filepath"
  printLog $LOG_LVL_TRACE "filename=$filename"
  printLog $LOG_LVL_TRACE "extension=$extension"

  # prepare header file
  cat /dev/null > $WORK_DIR/$filename
  if [[ ! -z "${__baseFiles}" ]]
  then
    for eachFile in $__baseFiles
    do
      cat $eachFile >> $WORK_DIR/$filename
    done
  fi

  ##################
  # Template : tmpl.xxxx
  # Variable : TMPL_PARM_
  # Format   : ${TMPL_PARM_}
  ##################
  for ((i=1;i<=$__loopCount;i++));
  do
    cp -Rp $WORK_DIR/$filename $WORK_DIR/$filename.org$i.$extension
    replaceTmplParams $i $__templateFile $WORK_DIR/$filename.org$i.$extension$WORK_FILE_EXT
    cat $WORK_DIR/$filename.org$i.$extension$WORK_FILE_EXT >> $WORK_DIR/$filename.org$i.$extension
    mv $WORK_DIR/$filename.org$i.$extension $filepath/$filename.org$i.$extension
    rm $WORK_DIR/$filename.org$i.$extension$WORK_FILE_EXT
    printLog $LOG_LVL_INFO "return $filepath/$filename.org$i.$extension"
  done

  rm $WORK_DIR/$filename
}




########
# function replaceTmplParams()
# arg1 : count
# arg2 : template file
# arg3 : output file
#
########
function replaceTmplParams()
{
  local __count=$1
  local __templateFile=$2
  local __outputFile=$3
  printLog $LOG_LVL_TRACE "============================================="
  printLog $LOG_LVL_DEBUG "__count=$__count"
  printLog $LOG_LVL_DEBUG "__templateFile=$__templateFile"
  printLog $LOG_LVL_DEBUG "__outputFile=$__outputFile"

  cp -Rp $__templateFile $__outputFile

  # Logic
  # 1. Per count, generate config for template
  getTmplParams $__count
  local __params=`( set -o posix ; set ) | sed -n 's/^\('$TMPL_VAR_PREFIX'.*\)=\(.*\)/${\1}=\2/gp' | sort -u`

  # 2. loop generated config, replace param with files
  for eachParam in $__params
  do
    param=(${eachParam//=/ })
    printLog $LOG_LVL_TRACE "name=${param[0]} value=${param[1]} "

    # UpdateTemplateLogic
    sed -e "s;${param[0]};${param[1]};g" $__outputFile > $__outputFile$WORK_FILE_EXT
    mv $__outputFile$WORK_FILE_EXT $__outputFile
  done
}

##################
# validation
##################
# Temporary limitation on generate config, need to revise the assignable port number
if [[ "$1" -lt 0 ]] || [[ "$1" -gt 9 ]]; then
  echo "Error : [OrgNumber] must within 0 to 9 "
  exit 0
fi
for ARG in $2
do
  if [[ $ARG != "auth" && $ARG != "gw-org" ]]; then
    echo "invalid arg $ARG!!! only accept \"auth\" or \"gw-org\""
    exit 0
  fi
  NGX_TMPL="$NGX_TMPL $TMPL_DIR/tmpl.ngx.$ARG"
done
if [[ ! -z $3 && ( $3 != "test" ||  "$1" -lt 2 && "$1" -gt 3 ) ]]; then
  echo "Error : arg {test} must combine with [org no] between 2 to 3 "
  exit 0
fi

##################
# main lgoic
##################

rm -Rf $WORK_DIR
mkdir -p $WORK_DIR


# Step 1 : configtx.yaml for bootstrap.sh
templateGenFile $TMPL_DIR/tmpl.configtx.yaml.template $ORG_COUNT $CONFIG/configtx.org.yaml 1

# Step 2 : connection.json.orgX for bootstrap.sh
genMultipleFiles $ORG_COUNT $TMPL_DIR/tmpl.connection.json $ARTIFACTS/connection.json

# Step 3 : compose.Xorg.cc.yaml for bootstrap.sh
genMultipleFiles $ORG_COUNT $TMPL_DIR/$TMPL_COMPOSE_CC $ARTIFACTS/compose.cc.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER
genFile $ORG_COUNT $TMPL_DIR/$TMPL_COMPOSE_CC $OUTPUT_DIR/compose.cc.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER

# Step 4 : compose.Xorg.yaml for bootstrap.sh
genFile 1 $TMPL_DIR/$TMPL_COMPOSE_ORDERER $OUTPUT_DIR/compose.orderer.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER
genFile $ORG_COUNT $TMPL_DIR/$TMPL_COMPOSE_ORG $OUTPUT_DIR/compose.org.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER

# Step 5 : compose.Xorg.db-red.yaml for bootstrap_supp.sh
genFile $ORG_COUNT $TMPL_DIR/$TMPL_COMPOSE_DBRD $OUTPUT_DIR/compose.db-red.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER

# Step 6 : compose.Xorg.auth.yaml for bootstrap_supp.sh
genFile $ORG_COUNT $TMPL_DIR/$TMPL_COMPOSE_AUTH $OUTPUT_DIR/compose.auth.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER

# Step 7 : compose.Xorg.ngx.yaml for bootstrap_supp.sh
genFile $ORG_COUNT $TMPL_DIR/$TMPL_COMPOSE_NGX $OUTPUT_DIR/compose.ngx.yaml $TMPL_DIR/$TMPL_COMPOSE_HEADER


# Gen ngx.template
cp -Rp $TMPL_DIR/$TMPL_NGX_CONF $WORK_DIR/ngx.template
printLog $LOG_LVL_TRACE "----- Gen NGINX Template -----[$NGX_TMPL]"
updateFile "$NGX_TMPL" "#%__tmpl.ngx.service__%" $WORK_DIR/ngx.template
mv $WORK_DIR/ngx.template $NGX_TEMPLATE
printLog $LOG_LVL_INFO "genConfig return $NGX_TEMPLATE"

COMPOSE_TEST_CNT=2
if [[ ! -z $3 &&  "$ORG_COUNT" -le 3 && "$ORG_COUNT" -ge 2 ]]; then
  COMPOSE_TEST_CNT=$ORG_COUNT
fi
cp -Rp $OUTPUT_DIR/compose.${COMPOSE_TEST_CNT}org.test.yaml $OUTPUT_DIR/compose.tester.yaml
printLog $LOG_LVL_INFO "genConfig return $OUTPUT_DIR/compose.tester.yaml"
