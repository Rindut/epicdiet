export const measureUnits={
  baselineKg:{kg:{factor:1,decimals:1,tick:1,label:'kg'},lb:{factor:2.2046226218,decimals:1,tick:2,label:'lb'}},
  heightCm:{cm:{factor:1,decimals:0,tick:1,label:'cm'},ft:{factor:1/30.48,decimals:2,tick:.1,label:'ft'}}
};
export function displayMeasure(value,name,unit){const u=measureUnits[name][unit];return Number((Number(value)*u.factor).toFixed(u.decimals));}
export function canonicalMeasure(value,name,unit){return Number(String(value).replace(',','.'))/measureUnits[name][unit].factor;}
export function rulerTicks(value,name,unit){
  const u=measureUnits[name][unit],center=Number(value)*u.factor,start=Math.floor(center/u.tick)-28;
  return Array.from({length:57},(_,i)=>{const index=start+i,n=index*u.tick;return {position:50+(n-center)/u.tick*1.75,major:index%(unit==='ft'?5:10)===0,label:Number(n.toFixed(2))};});
}
