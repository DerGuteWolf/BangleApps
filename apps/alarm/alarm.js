const locale = require("locale");
// Chances are boot0.js got run already and scheduled *another*
// 'load(alarm.js)' - so let's remove it first!
clearInterval();

function formatTime(t) {
  var hrs = 0|t;
  var mins = Math.round((t-hrs)*60);
  var d = new Date();
  d.setHours(hrs);
  d.setMinutes(mins);
  return locale.time(d, true);
}

function getCurrentHr() {
  var time = new Date();
  return time.getHours()+(time.getMinutes()/60)+(time.getSeconds()/3600);
}

function showAlarm(alarm) {
  var msg = formatTime(alarm.hr);
  var buzzCount = 10;
  if (alarm.msg)
    msg += "\n"+alarm.msg;
  const ok = locale.translate("Ok");
  E.showPrompt(msg,{
    title:"ALARM!"/*LANG*/,
    buttons : {"Sleep"/*LANG*/:true,ok:false} // default is sleep so it'll come back in 10 mins
  }).then(function(sleep) {
    buzzCount = 0;
    if (sleep) {
      alarm.hr += 10/60; // 10 minutes
    } else {
      alarm.last = (new Date()).getDate();
      if (!alarm.rp) alarm.on = false;
    }
    require("Storage").write("alarm.json",JSON.stringify(alarms));
    load();
  });
  function buzz() {
    Bangle.buzz(100).then(()=>{
      setTimeout(()=>{
        Bangle.buzz(100).then(function() {
          if (buzzCount--)
            setTimeout(buzz, 3000);
        });
      },100);
    });
  }
  buzz();
}

// Check for alarms
var day = (new Date()).getDate();
var hr = getCurrentHr()+10000; // get current time - 10s in future to ensure we alarm if we've started the app a tad early
var alarms = require("Storage").readJSON("alarm.json",1)||[];
var active = alarms.filter(a=>a.on&&(a.hr<hr)&&(a.last!=day));
if (active.length) {
  // if there's an alarm, show it
  active = active.sort((a,b)=>a.hr-b.hr);
  showAlarm(active[0]);
} else {
  // otherwise just go back to default app
  setTimeout(load, 100);
}
