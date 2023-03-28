import json
import requests
import time
import numpy as np
import os

def main():
    pathToFile = os.path.abspath(os.path.dirname(__file__))
    latestfile = f'{pathToFile}/latest.json'
    manfile = f'{pathToFile}/marketmanifest.json'
    currentManifest = requests.get("https://play.idlescape.com/api/market/manifest").json()
    if currentManifest['status'] != 'Success':
        print("No good")
        return
    try:
        with open(manfile) as j:
            previousManifest = json.load(j)
    except FileNotFoundError:
        previousManifest = {}
    # Save the latest manifest
    with open(latestfile, "w") as j:
        json.dump(currentManifest, j)
    nowTime = currentManifest['timestamp']
    manifest = currentManifest['manifest']
    for item in manifest:
        idu = str(item['itemID'])
        try:
            (previousManifest[idu])['time'].append(nowTime)
            (previousManifest[idu])['price'].append(item['minPrice'])
        except KeyError:
            previousManifest[item['itemID']] = { 'time': [nowTime], 
                    'price': [item['minPrice']] }
    with open(manfile, "w") as j:
        json.dump( previousManifest, j )


if __name__ == '__main__':
    main()
