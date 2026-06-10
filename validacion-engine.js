
// VALIDACION ENGINE V3
const ValidacionEngine={
 check(d){
  const advertencias=[], errores=[], penalizaciones=[];
  let calidad=100;
  const psi=Number(d.psi||0), amp=Number(d.amp||0), sh=Number(d.sh||0), sc=Number(d.sc||0);
  const tIn=Number(d.tempIn||0), tOut=Number(d.tempOut||0);
  const mins={R410A:90,R32:80,R22:50};
  if(d.gas && psi>0 && mins[d.gas] && psi<mins[d.gas]){advertencias.push(`PSI baja para ${d.gas}`); calidad-=10; penalizaciones.push("-10 PSI");}
  const amps={2250:[2.5,4.5],3000:[3.5,5.5],4500:[5,8]};
  const r=amps[d.frigorias];
  if(r&&amp<r[0]*0.5){advertencias.push("Amperaje muy bajo"); calidad-=10; penalizaciones.push("-10 AMP");}
  if(sh>35||sh<-20){advertencias.push("SH fuera de rango"); calidad-=10; penalizaciones.push("-10 SH");}
  if(sc>35||sc<-15){advertencias.push("SC fuera de rango"); calidad-=10; penalizaciones.push("-10 SC");}
  if(sh>15&&sc>15){advertencias.push("Posible restricción"); calidad-=10; penalizaciones.push("-10 SH/SC");}
  if(tIn&&tOut&&tOut>tIn){errores.push("Temperaturas invertidas"); calidad-=20; penalizaciones.push("-20 DeltaT");}
  return {calidad:Math.max(0,calidad),advertencias,errores,penalizaciones};
 }
};
