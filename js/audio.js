'use strict';
(function(G){
G.Audio=class{
constructor(settings){this.settings=settings;this.context=null;this.muted=false;this.timer=null;this.musicBuffer=null;this.musicSource=null;this.musicOffset=0;this.musicStarted=0;this.musicLoading=null;this.musicError=null;}
unlock(){
 if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.context=new C();this.musicGain=this.context.createGain();this.musicGain.gain.value=.45;this.musicGain.connect(this.context.destination);}
 if(!this.muted)this.context.resume().then(()=>this.updateMusic()).catch(()=>{});
 this.loadMusic();
 if(!this.timer)this.timer=setInterval(()=>this.updateMusic(),100);
}
loadMusic(){
 if(this.musicBuffer||this.musicLoading||!this.context)return;
 this.musicError=null;
 this.musicLoading=fetch('assets/audio/newsroom-night.mp3').then(r=>{if(!r.ok)throw new Error('Music HTTP '+r.status);return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).then(buffer=>{this.musicBuffer=buffer;this.updateMusic();}).catch(error=>{this.musicError=error.message;}).finally(()=>{this.musicLoading=null;});
}
stopMusic(){
 if(!this.musicSource)return;
 this.musicOffset=(this.musicOffset+Math.max(0,this.context.currentTime-this.musicStarted))%this.musicBuffer.duration;
 this.musicSource.stop();this.musicSource.disconnect();this.musicSource=null;
}
updateMusic(){
 const c=this.context;if(!c)return;
 if(!this.settings.music||this.muted||c.state!=='running'){this.stopMusic();return;}
 if(!this.musicBuffer||this.musicSource)return;
 const source=c.createBufferSource();source.buffer=this.musicBuffer;source.loop=true;source.loopStart=0;source.loopEnd=this.musicBuffer.duration;source.connect(this.musicGain);
 this.musicStarted=c.currentTime;this.musicSource=source;source.start(0,this.musicOffset);
}
tone(freq,duration=.07,volume=.025,type='sine'){const c=this.context;if(!c||this.muted||c.state!=='running')return;const osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);osc.connect(gain);gain.connect(c.destination);osc.start();osc.stop(c.currentTime+duration);}
play(kind){if(!this.settings.sound)return;const frequencies={key:480,error:120,success:680,finish:880,coin:1046,achievement:1174,gift:1318,scene:392};this.tone(frequencies[kind]||480,kind==='key'?.035:.28,kind==='key'?.015:.04,kind==='error'?'triangle':'sine');}
mute(value){this.muted=value;if(value)this.stopMusic();if(this.context){if(value)this.context.suspend().catch(()=>{});else this.context.resume().then(()=>this.updateMusic()).catch(()=>{});}}
};
})(EditorGame);
