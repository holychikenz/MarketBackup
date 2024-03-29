class marketview {
  constructor(data){
    this.data = data;
    getJSON("https://raw.githubusercontent.com/holychikenz/ISMonkey/main/data/itemsComplete.json").then(
      data => {this.items = data; this.setupUI()});
  }
  setupUI(){
    let self = this
    self.plotlyData = [];
    // Fill selector
    let selector = document.getElementById("itemchoice")
    for( const [key, value] of Object.entries(self.data) ){
      let newoption = document.createElement("option")
      let formattedName = `${key}: ${(self.items[key].name ?? "")}`
      newoption.value = key
      newoption.innerText = formattedName // Grab from external json
      selector.append(newoption)
    }
    // Bootup select2
    $(document).ready(function(){
      $('.selectTwo').select2();
    });
    $('#itemchoice').on('select2:select', ()=>{
      self.updatePlot(self);
    });
    // Connect our filter
    let filter = document.getElementById("filter");
    filter.addEventListener('keyup', ()=>self.updateFilter(self));
    // Reset button
    let resetButton = document.getElementById("resetButton");
    resetButton.addEventListener('click', ()=>self.reset(self));
    // Defaults
    let newvalue = []
    try {
      newvalue = JSON.parse(localStorage.ismarketchoice)
      $('#itemchoice').val(newvalue);
      $('#itemchoice').trigger('change');
    } catch {}
    self.updateFilter(self);
    self.createPlot(self);
    self.updateClickMarket(self);
    document.querySelectorAll(".select2").forEach(e=>e.style.display="none");
  }
  reset(self){
    $('#itemchoice').val([]);
    $('#itemchoice').trigger('change');
    self.updateFilter(self);
    self.updatePlot(self);
    self.updateClickMarket(self);
  }
  createPlot(self){
    let traces = [];
    for( let choice of $('#itemchoice').select2('data').map(k=>k.id) ){
      let item = self.data[choice];
      let trace = {
        x: item.time,
        y: item.price,
        type: 'scatter',
        name: (self.items[choice].name ?? ""),
      };
      traces.push(trace);
    }
    self.plotlyData = traces;
    var updatemenus = [{
      y: 0.4,
      yanchor: 'top',
      buttons: [{
        method: 'relayout',
        args: [{'yaxis.type': 'linear'}],
        label: 'Scale: Linear',
      },{
        method: 'relayout',
        args: [{'yaxis.type': 'log'}],
        label: 'Scale: Log',
      }],
    }]
    var layout = {
      //title: `${self.items[choice].name}`,
      plot_bgcolor: "rgb(66 66 66 / 66%)",
      paper_bgcolor: "rgb(66 66 66 / 66%)",
      font: {color: "#fff",},
      showlegend: true,
      updatemenus: updatemenus,
    }

    Plotly.newPlot('plot', traces, layout, {responsive:true});
  }
  updatePlot(self){
    Plotly.deleteTraces('plot', [...Array(self.plotlyData.length).keys()]);
    let traces = [];
    for( let choice of $('#itemchoice').select2('data').map(k=>k.id) ){
      let item = self.data[choice];
      let trace = {
        x: item.time,
        y: item.price,
        type: 'scatter',
        name: (self.items[choice].name ?? ""),
      };
      traces.push(trace);
    }
    self.plotlyData = traces;
    Plotly.addTraces('plot', self.plotlyData);
  }
  updateFilter(self){
    self.itemSort = Object.entries(self.items).map(k=>k[0]);
    let input = document.getElementById("filter");
    let value = input.value;
    let expression = new RegExp(value);
    self.itemSort = [];
    for( const [id, item] of Object.entries(self.items) ){
      if( expression.test((item.name ?? "").toLowerCase()) ||
          expression.test(item.class.toLowerCase()) ){
        self.itemSort.push(id);
      }
    }
    self.updateClickMarket(self);
  }
  updateClickMarket(self){
    let cm = document.getElementById("clickMarket");
    cm.innerHTML='';
    let itemSort = self.itemSort;
    // Already selected items
    let selectedItems = $('#itemchoice').select2('data').map(k=>k.id)
    // Build the item views
    for(let item of itemSort){
      if(item in self.data){
        let priceHistory = self.data[item].price
        let itemDiv = document.createElement("div");
        itemDiv.className = `clickMarketItem ${self.items[item].class}`;
        let icon = document.createElement("img");
        let baseImage = (self.items[item].itemIcon ?? (self.items[item].itemImage ?? ""))
        icon.src = `https://play.idlescape.com/${baseImage}`;
        itemDiv.append(icon);
        // Name
        let itemName = document.createElement("div");
        itemName.className="clickMarketItemName";
        //itemName.innerText = self.items[item].name;
        itemName.innerText = dnum(priceHistory[priceHistory.length - 1],1);
        itemDiv.append(itemName);
        // Daily Change
        cm.append(itemDiv);
        // What to do on click
        function clicked(){
          // Retrieve old list
          let oldList = $('#itemchoice').select2('data').map(k=>k.id)
          if( oldList.includes(item) ){
            const index = oldList.indexOf(item);
            oldList.splice(index, 1);
            itemDiv.style.filter="unset"
          } else {
            oldList.push(item);
            itemDiv.style.filter="drop-shadow(0 0 5px #EEE)drop-shadow(0 0 5px rgba(94,191,244,0.5))"
          }
          localStorage.ismarketchoice = JSON.stringify(oldList);
          $('#itemchoice').val(oldList);
          $('#itemchoice').trigger('change');
          self.updatePlot(self);
        }
        if( selectedItems.includes(item) ){
          itemDiv.style.filter="drop-shadow(0 0 5px #EEE)drop-shadow(0 0 5px rgba(94,191,244,0.5))"
        }
        itemDiv.addEventListener('click', clicked);
      }
    }
  }
};

const getJSON = async url => {
  try {
    const response = await fetch(url);
    if(!response.ok)
      throw new Error(response.statusText);
    const data = await response.json();
    return data;
  } catch(error) {
    return error;
  }
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function timeFormat(time){
  time = Math.floor(time);
  let hours = Math.floor(time/3600);
  let minutes = Math.floor((time-(hours*3600))/60);
  let seconds = time - (hours*3600) - (minutes*60);
  if( hours < 10 ){hours = `0${hours}`;}
  if( minutes < 10 ){minutes = `0${minutes}`;}
  if( seconds < 10 ){seconds = `0${seconds}`;}
  return `${hours}:${minutes}:${seconds}`;
}

function timeFormatFull(time){
  time = Math.floor(time);
  let days = Math.floor(time/86400);
  let rTime = time - days*86400;
  let hours = Math.floor(rTime/3600);
  rTime -= hours*3600;
  let minutes = Math.floor(rTime/60);
  rTime -= minutes*60;
  let seconds = Math.floor(rTime)
  let rString = ""
  if( days > 0 ){rString += `${days}d `;}
  if( hours > 0 || days > 0 ){rString += `${hours}h `;}
  if( minutes > 0 || hours > 0 || days > 0 ){rString += `${minutes}m `;}
  rString += `${seconds}s`;
  return rString;
}

function dnum(num, p) {
  let snum = ""
  if( num >= 1e9 ){
    snum = `${(num/1e9).toFixed(p)} B`;
  }
  else if( num >= 1e6 ){
    snum = `${(num/1e6).toFixed(p)} M`
  }
  else if( num >= 1e3 ){
    snum = `${(num/1e3).toFixed(p)} k`
  }
  else{
    snum = `${(num).toFixed(p)}`
  }
  return snum
}
