const t=document.getElementById('time');
for(let i=8;i<=21;i++){
 let h=i%12||12;
 let ap=i<12?'AM':'PM';
 let o=document.createElement('option');
 o.text=h+':00 '+ap;
 t.add(o);
}
