#!/bin/bash

groupName=$1
servicePlanName=$2
appName=$3
gitrepo=https://github.com/nagarjuna90/revature-p1



# Create a resource group.
az group create --location southcentralus --name $groupName

# Create an App Service plan in `B1` tier.
az appservice plan create --name $servicePlanName --resource-group $groupName --sku B1 --location southcentralus --is-linux

# Create a web app.
az webapp create --resource-group $groupName --plan $servicePlanName --name $appName -r "node|10.14"

# Configure continuous deployment from GitHub. 

az webapp deployment source config --name $appName --resource-group $groupName \
--repo-url $gitrepo --branch master 

# add instances 
az appservice plan update -g $groupName -n $servicePlanName --number-of-workers 3

echo http://$appName.azurewebsites.net