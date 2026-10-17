import './polyfills.server.mjs';
import{a as i}from"./chunk-6EBRP6L6.mjs";var s=class{constructor(){this._gpuTimeInFrameId=-1,this.counter=new i}_addDuration(t,e){t<this._gpuTimeInFrameId||(this._gpuTimeInFrameId!==t?(this.counter._fetchResult(),this.counter.fetchNewFrame(),this.counter.addCount(e,!1),this._gpuTimeInFrameId=t):this.counter.addCount(e,!1))}};export{s as a};
