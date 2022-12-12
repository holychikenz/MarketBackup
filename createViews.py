import json
import datetime as dt
import os
import numpy as np

def main():
    ptf = os.path.abspath(os.path.dirname(__file__))
    manifest_directory = f'{ptf}/daily'
    view_directory = f'{ptf}/views'
    flist = [f'{manifest_directory}/{f}' for f in os.listdir(manifest_directory) if f.endswith(".json")]

    ## Outputs
    # 1. Daily average
    dailyAverage = f'{view_directory}/dailyAverage.json'
    dailyManifest = {}
    for f in flist:
        with open(f) as j:
            manifest = json.load(j)
            for itemID, info in manifest.items():
                times = np.array(info['time'])
                prices = np.array(info['price'])
                dates = np.array([dt.datetime.strptime(a.split(".")[0],"%Y-%m-%dT%H:%M:%S") for a in times])
                averagePrice = np.mean(prices)
                lowDate, highDate = min(dates), max(dates)
                midDate = lowDate + (highDate - lowDate)/2
                if itemID not in dailyManifest:
                    dailyManifest[itemID] = {
                            'time': [],
                            'price': []
                            }
                dailyManifest[itemID]['time'].append(midDate)
                dailyManifest[itemID]['price'].append(averagePrice)
    dailyManifest = sortManifest(dailyManifest)
    with open(dailyAverage, "w") as j:
        print(dailyManifest)
        json.dump(dailyManifest, j)

    # 2. Hourly average, 1 week

    # Now that we have historical data, we can create a few views from that.
    # Hourly average, daily average, etc.

def sortManifest(man):
    for itemID, info in man.items():
        times, prices = zip(*sorted(zip(info['time'], info['price'])))
        times = [t.strftime("%Y-%m-%d") for t in np.array(times)]
        prices = np.array(prices).tolist()
        man[itemID]['time'] = times
        man[itemID]['price'] = prices
    return man

if __name__ == '__main__':
    main()
