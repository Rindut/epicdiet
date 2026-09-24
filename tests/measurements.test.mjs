import test from 'node:test';
import assert from 'node:assert/strict';
import {displayMeasure,canonicalMeasure,rulerTicks} from '../dist/measurements.js';
import {validateProfile,exportCsv,initialState} from '../dist/core.js';
test('Imperial display and typed values convert to canonical kg/cm',()=>{
  assert.equal(displayMeasure(82,'baselineKg','lb'),180.8);
  assert.ok(Math.abs(canonicalMeasure('180.8','baselineKg','lb')-82)<.02);
  assert.equal(displayMeasure(156,'heightCm','ft'),5.12);
  assert.ok(Math.abs(canonicalMeasure('5,5','heightCm','ft')-167.64)<1e-9);
  assert.equal(canonicalMeasure('40','baselineKg','kg'),40);
});
test('Ruler ticks align the selected measure with the center marker',()=>{
  for(const [name,unit,value] of [['baselineKg','kg',70],['heightCm','cm',170]]){
    const selected=rulerTicks(value,name,unit).find(t=>t.label===value);
    assert.equal(selected.position,50);assert.equal(selected.major,true);
  }
});
test('Blood group is optional, validated, and included in exported data',()=>{
  const p={startDate:'2026-09-24',baselineKg:82,heightCm:156,proteinG:90,movementMinutes:30,strengthSessions:3,longTermGoalKg:60};
  assert.deepEqual(validateProfile({...p},p.startDate),{});
  assert.deepEqual(validateProfile({...p,bloodType:'A+'},p.startDate),{});
  assert.ok(validateProfile({...p,bloodType:'invalid'},p.startDate).bloodType);
  const state=initialState();state.profile={...p,bloodType:'A+'};
  const csv=exportCsv(state);assert.ok(csv.split('\n')[0].includes('bloodType'));assert.ok(csv.includes('"A+"'));
});
