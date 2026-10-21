'use strict';
(function(G){
const INTERVAL=10*60*1000,MAX=5;
G.Energy={INTERVAL,MAX,
recover(s,now=Date.now()){if(s.energy>=MAX){s.energy=MAX;s.energyAt=now;return;}if(now<s.energyAt){s.energyAt=now;return;}
const n=Math.floor((now-s.energyAt)/INTERVAL);if(n>0){s.energy=Math.min(MAX,s.energy+n);s.energyAt=s.energy===MAX?now:s.energyAt+n*INTERVAL;}},
spend(s,now=Date.now()){this.recover(s,now);if(s.energy<1)return false;if(s.energy===MAX)s.energyAt=now;s.energy--;return true;},
add(s,n=1,now=Date.now()){this.recover(s,now);s.energy=Math.min(MAX,s.energy+n);if(s.energy===MAX)s.energyAt=now;},
remaining(s,now=Date.now()){return s.energy>=MAX?0:Math.max(0,INTERVAL-(now-s.energyAt));}
};
})(EditorGame);
