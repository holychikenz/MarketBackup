import json
import datetime as dt
import os
import numpy as np

def main():
    ptf = os.path.abspath(os.path.dirname(__file__))
    manifest_file = f'{ptf}/marketmanifest.json'
    # This is intended to be a slow update with lots of opening and closing of files
    with open(manifest_file) as j:
        manifest = json.load(j)
    for itemID, info in manifest.items():
        times  = np.array(info['time'])
        prices = np.array(info['price'])
        dates = np.array([dt.datetime.strptime(a.split("T")[0],"%Y-%m-%d") for a in times])
        uniqueDays = np.unique(dates)
        for day in uniqueDays:
            select = (dates == day)
            jfname = f'{ptf}/daily/manifest_{day.strftime("%Y-%m-%d")}.json'
            if os.path.exists(jfname):
                with open(jfname) as jf:
                    historical = json.load(jf)
            else:
                historical = {}
            historicalInfo = historical.get(itemID, {'time':[], 'price':[]})
            historicalInfo['time'] += times[select].tolist()
            historicalInfo['price'] += prices[select].tolist()
            historical[itemID] = historicalInfo
            with open(jfname, 'w') as jf:
                json.dump(historical, jf )
    # Cleanup
    os.remove(manifest_file)

if __name__ == '__main__':
    main()
